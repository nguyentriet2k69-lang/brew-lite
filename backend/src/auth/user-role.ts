export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type AppUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function isAppUserRole(value: unknown): value is AppUserRole {
  return value === USER_ROLES.USER || value === USER_ROLES.ADMIN;
}
