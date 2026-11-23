import { NextResponse } from 'next/server';
import { destroySession } from '@/entities/session';

/** Clears the session cookies (Server Components can't) and sends the user to the login page. */
export async function GET(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
