import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'auditAction';

export interface AuditActionMeta {
  action: string;
  entityType: string;
}

export const AuditLog = (meta: AuditActionMeta) => SetMetadata(AUDIT_ACTION_KEY, meta);
