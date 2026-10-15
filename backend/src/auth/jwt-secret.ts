import { InternalServerErrorException } from '@nestjs/common';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new InternalServerErrorException('JWT_SECRET must contain at least 32 characters');
  }
  return secret;
}
