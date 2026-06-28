import type { User } from 'firebase/auth';

const AUTHORITY_EMAILS = [
  'admin@gmail.com',
  'admin@civicpulse.org',
  'authority@civicpulse.org',
];

export function isAuthorityUser(user: User | null | undefined): boolean {
  const email = user?.email?.toLowerCase();
  return !!email && AUTHORITY_EMAILS.includes(email);
}