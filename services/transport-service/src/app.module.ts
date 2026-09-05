import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { validateEnv } from './common/config/env.validation';
import { PrismaModule } from './common/prisma/prisma.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { TransportRequestsModule } from './modules/transport-requests/transport-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    KafkaModule,
    FleetModule,
    TransportRequestsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
