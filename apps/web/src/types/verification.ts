export interface VerificationRequest {
  id: string;
  type: 'IDENTITY' | 'HEALTH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  documents: { id: string; fileType: string; uploadedAt: string }[];
}
