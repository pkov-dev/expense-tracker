import { NextResponse } from 'next/server';
import { endSession } from '@/entities/session/server';
import { ROUTES } from '@/shared/config';

/**
 * Ends the session and sends the user to the login page. Server Components can't delete cookies, so a
 * dead session is redirected here. It is a GET with a side effect, so refuse requests that another site
 * triggered (a link or image there must not be able to log the user out).
 */
export async function GET(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  // Browsers always send it: "same-origin" is our own redirect, "none" a typed or bookmarked URL.
  if (site && site !== 'same-origin' && site !== 'none') return new NextResponse(null, { status: 403 });

  await endSession();
  return NextResponse.redirect(new URL(ROUTES.login, request.url));
}
