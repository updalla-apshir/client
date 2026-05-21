export type UserRole = 'admin' | 'manager' | 'accountant';

export const menuPermissions: Record<string, UserRole[]> = {
  "Dashboard": ['admin', 'manager', 'accountant'],
  "Property Management": ['admin', 'manager'],
  "Tenants": ['admin', 'manager'],
  "Leasing": ['admin', 'manager', 'accountant'],
  "Finance": ['admin', 'accountant'],
  "Parking": ['admin', 'manager'],
  "Operations": ['admin', 'manager'],
  "System": ['admin'],
};

export function hasMenuAccess(role: UserRole | null, menuTitle: string): boolean {
  if (!role) return false;
  const allowedRoles = menuPermissions[menuTitle];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
