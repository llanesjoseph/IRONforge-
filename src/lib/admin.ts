// Admin configuration
const ADMIN_EMAIL = 'joseph@crucibleanalytics.dev';

export function isAdminEmail(email: string | undefined | null): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}
