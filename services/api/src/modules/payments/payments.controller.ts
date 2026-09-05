import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles('CUSTOMER')
  @Post('bookings/:bookingId/initiate')
  initiate(@CurrentUser() user: AuthenticatedUser, @Param('bookingId') bookingId: string) {
    return this.payments.initiate(bookingId, user.id);
  }

  @Roles('CUSTOMER')
  @HttpCode(HttpStatus.OK)
  @Post(':paymentId/simulate')
  simulate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId') paymentId: string,
    @Body() dto: SimulatePaymentDto,
  ) {
    return this.payments.simulateMockPayment(paymentId, user.id, dto.outcome);
  }

  /**
   * Real gateway webhook endpoint. Requires the raw request body (enabled via
   * `rawBody: true` in main.ts) so the HMAC signature can be verified against
   * exactly the bytes the provider signed — never the re-serialized JSON.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhooks/:provider')
  async webhook(@Param('provider') provider: string, @Req() req: Request) {
    const name = provider.toUpperCase();
    if (name !== 'MOCK' && name !== 'RAZORPAY') {
      throw new BadRequestException('Unknown payment provider');
    }
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body for webhook signature verification');
    }
    const signature = (req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature']) as
      | string
      | undefined;
    return this.payments.processWebhook(name, rawBody, signature);
  }
}
