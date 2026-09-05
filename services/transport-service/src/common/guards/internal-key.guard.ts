import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Trust boundary for admin-only mutations (driver/vehicle onboarding). In this
 * monorepo the transport-service is trusted network only — the main API (or an
 * admin tool) authenticates its own caller, then forwards this shared key.
 * Production would swap this for mTLS or a signed service JWT.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-internal-key'];
    if (key !== this.config.get<string>('INTERNAL_SERVICE_KEY')) {
      throw new UnauthorizedException('Missing or invalid internal service key');
    }
    return true;
  }
}
