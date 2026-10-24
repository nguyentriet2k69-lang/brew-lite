import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentGateway } from './mock-payment.gateway';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}