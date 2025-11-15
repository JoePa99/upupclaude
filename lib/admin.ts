/**
 * Check if the current user is a superadmin
 */
export function isSuperAdmin(email: string | undefined): boolean {
  const superAdminEmail = 'joe@upupdndn.ai';
  return email === superAdminEmail;
}

/**
 * Superadmin emails list (can be expanded)
 */
export const SUPER_ADMIN_EMAILS = [
  'joe@upupdndn.ai',
];

export function checkSuperAdmin(email: string | undefined): void {
  if (!isSuperAdmin(email)) {
    throw new Error('Unauthorized: Superadmin access required');
  }
}
