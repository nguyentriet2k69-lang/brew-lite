import { SetMetadata } from '@nestjs/common';
import type { AppUserRole } from '../user-role';

export const ROLES_KEY = 'required-roles';
export const Roles = (...roles: AppUserRole[]) => SetMetadata(ROLES_KEY, roles);
