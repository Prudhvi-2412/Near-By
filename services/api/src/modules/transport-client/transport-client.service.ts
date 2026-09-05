import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin HTTP client to the independently-deployed transport-service. Kept
 * intentionally small — the main API never touches transport-service's
 * database, only its public HTTP surface, so the two can scale and deploy
 * separately (see docs/architecture.md).
 */
@Injectable()
export class TransportClientService {
  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>('TRANSPORT_SERVICE_URL')!;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', ...init?.headers },
      });
    } catch {
      throw new BadGatewayException('Transport service is currently unreachable');
    }
    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`Transport service error: ${body}`);
    }
    return response.json() as Promise<T>;
  }

  requestRide(requesterId: string, pickupLocation: string, dropoffLocation: string) {
    return this.request('/transport-requests', {
      method: 'POST',
      body: JSON.stringify({ requesterId, pickupLocation, dropoffLocation }),
    });
  }

  listMine(requesterId: string) {
    return this.request(`/transport-requests?requesterId=${encodeURIComponent(requesterId)}`);
  }

  getOne(id: string) {
    return this.request(`/transport-requests/${id}`);
  }

  cancel(id: string) {
    return this.request(`/transport-requests/${id}/cancel`, { method: 'POST' });
  }
}
