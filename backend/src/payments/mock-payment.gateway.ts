import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class MockPaymentGateway {
  /**
   * Deterministic local simulation. The result is configured by the server,
   * never by request data sent from the browser.
   */
  execute(): PaymentStatus {
    const result = (process.env.MOCK_PAYMENT_RESULT ?? 'success')
      .trim()
      .toLowerCase();

    if (result === 'success') return PaymentStatus.SUCCEEDED;
    if (result === 'failure') return PaymentStatus.FAILED;

    throw new InternalServerErrorException(
      'MOCK_PAYMENT_RESULT phải là "success" hoặc "failure"',
    );
  }
}
