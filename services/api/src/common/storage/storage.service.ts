import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const BUCKETS = {
  MEDIA: 'S3_BUCKET_MEDIA',
  VERIFICATION: 'S3_BUCKET_VERIFICATION',
} as const;

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly endpoint: string;

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get<string>('S3_ENDPOINT')!;
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: this.config.get<string>('S3_REGION'),
      forcePathStyle: this.config.get<boolean>('S3_FORCE_PATH_STYLE'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY')!,
      },
    });
  }

  bucketName(bucket: keyof typeof BUCKETS): string {
    return this.config.get<string>(BUCKETS[bucket])!;
  }

  /** Presigned PUT URL so the browser can upload directly without proxying bytes through the API. */
  async getUploadUrl(bucket: keyof typeof BUCKETS, key: string, contentType: string, expiresInSeconds = 300) {
    const command = new PutObjectCommand({ Bucket: this.bucketName(bucket), Key: key, ContentType: contentType });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    return { url, key, bucket: this.bucketName(bucket) };
  }

  /** Presigned GET URL for private documents (e.g. health/identity verification files). */
  async getDownloadUrl(bucket: keyof typeof BUCKETS, key: string, expiresInSeconds = 300) {
    const command = new GetObjectCommand({ Bucket: this.bucketName(bucket), Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /** Public URL for the media bucket, which minio-init makes anonymously downloadable. */
  getPublicUrl(bucket: keyof typeof BUCKETS, key: string): string {
    return `${this.endpoint}/${this.bucketName(bucket)}/${key}`;
  }

  async deleteObject(bucket: keyof typeof BUCKETS, key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketName(bucket), Key: key }));
  }
}
