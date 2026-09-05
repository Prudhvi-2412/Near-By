import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { validateEnv } from './common/config/env.validation';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { PaymentsProviderModule } from './common/payments/payments-provider.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { VerificationModule } from './modules/verification/verification.module';
import { AccommodationModule } from './modules/accommodation/accommodation.module';
import { SafetyModule } from './modules/safety/safety.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { AdminModule } from './modules/admin/admin.module';
import { TransportClientModule } from './modules/transport-client/transport-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    StorageModule,
    KafkaModule,
    PaymentsProviderModule,
    UsersModule,
    AuthModule,
    ProvidersModule,
    BookingsModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    ReviewsModule,
    MessagesModule,
    PricingModule,
    VerificationModule,
    AccommodationModule,
    SafetyModule,
    DisputesModule,
    AdminModule,
    TransportClientModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
