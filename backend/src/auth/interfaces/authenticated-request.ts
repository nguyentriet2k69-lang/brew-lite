import type { Request } from 'express';
import type { AppUserRole } from '../user-role';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: AppUserRole;
}

export type AuthenticatedRequest = Request & {
  user?: AccessTokenPayload;
};
