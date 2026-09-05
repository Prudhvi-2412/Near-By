import { Module } from '@nestjs/common';
import { TransportRequestsController } from './transport-requests.controller';
import { TransportRequestsService } from './transport-requests.service';
import { FleetModule } from '../fleet/fleet.module';

@Module({
  imports: [FleetModule],
  controllers: [TransportRequestsController],
  providers: [TransportRequestsService],
})
export class TransportRequestsModule {}
