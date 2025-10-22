// Admin configuration
const ADMIN_EMAIL = 'joseph@crucibleanalytics.dev';

// Coach whitelist - add coach emails here
// When someone signs in with Google using these emails, they'll automatically be a coach
const COACH_EMAILS: string[] = [
  // Add coach emails here (lowercase)
  // Example: 'coach@school.edu',
];

export function isAdminEmail(email: string | undefined | null): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isCoachEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return COACH_EMAILS.includes(email.toLowerCase());
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}

export function getCoachEmails(): string[] {
  return [...COACH_EMAILS];
}

export function addCoachEmail(email: string): void {
  const lowerEmail = email.toLowerCase();
  if (!COACH_EMAILS.includes(lowerEmail)) {
    COACH_EMAILS.push(lowerEmail);
  }
}
