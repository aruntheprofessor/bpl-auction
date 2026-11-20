// Very simple password protection for the auctioneer pages.
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'auction_token';

function expectedToken() {
  return crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD || '')
    .update('bpl-auction-v1')
    .digest('hex');
}

export function checkPassword(input) {
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(process.env.ADMIN_PASSWORD || '');
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function makeToken() {
  return expectedToken();
}

export function isLoggedIn() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const value = cookies().get(COOKIE_NAME)?.value;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expectedToken());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
