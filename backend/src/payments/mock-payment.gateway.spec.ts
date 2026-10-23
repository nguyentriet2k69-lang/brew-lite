import { InternalServerErrorException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { MockPaymentGateway } from './mock-payment.gateway';

describe('MockPaymentGateway', () => {
  const originalValue = process.env.MOCK_PAYMENT_RESULT;
  const gateway = new MockPaymentGateway();

  afterAll(() => {
    if (originalValue === undefined) delete process.env.MOCK_PAYMENT_RESULT;
    else process.env.MOCK_PAYMENT_RESULT = originalValue;
  });

  it('defaults to a deterministic success result', () => {
    delete process.env.MOCK_PAYMENT_RESULT;
    expect(gateway.execute()).toBe(PaymentStatus.SUCCEEDED);
  });

  it('can deterministically simulate a failure', () => {
    process.env.MOCK_PAYMENT_RESULT = 'failure';
    expect(gateway.execute()).toBe(PaymentStatus.FAILED);
  });

  it('rejects unsupported server configuration instead of reporting success', () => {
    process.env.MOCK_PAYMENT_RESULT = 'random';
    expect(() => gateway.execute()).toThrow(InternalServerErrorException);
  });
});
