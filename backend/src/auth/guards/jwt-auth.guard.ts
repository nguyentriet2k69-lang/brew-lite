import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request';
import { getJwtSecret } from '../jwt-secret';
import { isAppUserRole } from '../user-role';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
      if (typeof decoded === 'string') throw new Error('Invalid token payload');

      const payload = decoded as JwtPayload;
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !isAppUserRole(payload.role)
      ) {
        throw new Error('Invalid token payload');
      }

      request.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
