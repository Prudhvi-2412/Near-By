import { Module } from '@nestjs/common';
import { TransportClientController } from './transport-client.controller';
import { TransportClientService } from './transport-client.service';

@Module({
  controllers: [TransportClientController],
  providers: [TransportClientService],
})
export class TransportClientModule {}
