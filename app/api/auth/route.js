// Tells the screens whether the auctioneer is logged in.
import { NextResponse } from 'next/server';
import { isLoggedIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: isLoggedIn() });
}
