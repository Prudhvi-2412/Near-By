import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ACTION_KEY, type AuditActionMeta } from '../decorators/audit-log.decorator';
import { Reflector } from '@nestjs/core';

/** Writes an audit_logs row for handlers annotated with @AuditLog(...) after a successful response. */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditActionMeta>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap((result: unknown) => {
        const resultId = (result as { id?: string } | undefined)?.id;
        this.prisma.auditLog
          .create({
            data: {
              actorId: user?.id ?? null,
              actorRole: user?.roles?.[0] ?? null,
              action: meta.action,
              entityType: meta.entityType,
              entityId: resultId ?? request.params?.id ?? null,
              ipAddress: request.ip,
              metadata: { method: request.method, path: request.originalUrl },
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
