import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { TOPICS } from '@near-by/events';
import { randomSuffix } from '../providers/providers.util';

const HEALTH_CERT_VALIDITY_DAYS = 180;

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly kafka: KafkaProducerService,
  ) {}

  private async requireOwnProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Complete your provider profile first');
    }
    return profile;
  }

  async createRequest(userId: string, type: 'IDENTITY' | 'HEALTH') {
    const profile = await this.requireOwnProfile(userId);
    const pending = await this.prisma.verificationRequest.findFirst({
      where: { providerId: profile.id, type, status: 'PENDING' },
    });
    if (pending) {
      throw new ConflictException(`You already have a pending ${type.toLowerCase()} verification request`);
    }
    return this.prisma.verificationRequest.create({ data: { providerId: profile.id, type } });
  }

  async getUploadUrl(userId: string, requestId: string, contentType: string) {
    const profile = await this.requireOwnProfile(userId);
    const request = await this.prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request || request.providerId !== profile.id) {
      throw new NotFoundException('Verification request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been reviewed');
    }
    const ext = contentType.split('/')[1] ?? 'pdf';
    const key = `verification/${profile.id}/${requestId}/${randomSuffix(8)}.${ext}`;
    return this.storage.getUploadUrl('VERIFICATION', key, contentType);
  }

  async attachDocument(userId: string, requestId: string, key: string, fileType: string) {
    const profile = await this.requireOwnProfile(userId);
    const request = await this.prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request || request.providerId !== profile.id) {
      throw new NotFoundException('Verification request not found');
    }
    return this.prisma.verificationDocument.create({ data: { verificationRequestId: requestId, fileKey: key, fileType } });
  }

  async listMine(userId: string) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.verificationRequest.findMany({
      where: { providerId: profile.id },
      include: { documents: { select: { id: true, fileType: true, uploadedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async healthStatus(providerId: string) {
    const latest = await this.prisma.verificationRequest.findFirst({
      where: { providerId, type: 'HEALTH', status: 'APPROVED' },
      orderBy: { verifiedAt: 'desc' },
    });
    const current = !!latest && (!latest.expiresAt || latest.expiresAt > new Date());
    return current
      ? { verified: true, verifiedOn: latest!.verifiedAt, expiresOn: latest!.expiresAt }
      : { verified: false };
  }

  // ---- Admin ----

  adminListQueue(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.verificationRequest.findMany({
      where: status ? { status } : undefined,
      include: { provider: { select: { id: true, displayName: true, city: true, userId: true } }, documents: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async adminGetDocumentUrl(documentId: string) {
    const doc = await this.prisma.verificationDocument.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return this.storage.getDownloadUrl('VERIFICATION', doc.fileKey);
  }

  async adminReview(requestId: string, adminId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const request = await this.prisma.verificationRequest.findUnique({ where: { id: requestId }, include: { provider: true } });
    if (!request) {
      throw new NotFoundException('Verification request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been reviewed');
    }

    const updated = await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
        expiresAt:
          status === 'APPROVED' && request.type === 'HEALTH'
            ? new Date(Date.now() + HEALTH_CERT_VALIDITY_DAYS * 24 * 60 * 60_000)
            : null,
      },
    });

    if (status === 'APPROVED' && request.type === 'IDENTITY') {
      await this.prisma.providerProfile.update({
        where: { id: request.providerId },
        data: { identityVerification: 'VERIFIED' },
      });
    }

    await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
      userId: request.provider.userId,
      type: 'VERIFICATION_UPDATE',
      title: `${request.type === 'HEALTH' ? 'Health' : 'Identity'} verification ${status.toLowerCase()}`,
      body:
        status === 'APPROVED'
          ? `Your ${request.type.toLowerCase()} verification has been approved.`
          : `Your ${request.type.toLowerCase()} verification was rejected: ${rejectionReason ?? 'no reason provided'}.`,
      channel: 'IN_APP',
    });

    return updated;
  }
}
