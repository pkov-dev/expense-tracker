import { NextResponse } from 'next/server';
import { endSession } from '@/entities/session/server';
import { ROUTES } from '@/shared/config';

/**
 * Shown instead of logging out when another site sent the user here. The link is clicked from our own
 * page, so that request is `same-origin` and goes through: the user gets a way out, a hostile page does not.
 */
const CONFIRM_PAGE = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Выход</title>
  </head>
  <body style="font-family: system-ui, sans-serif; max-width: 28rem; margin: 4rem auto; padding: 0 1rem">
    <h1 style="font-size: 1.25rem">Подтвердите выход</h1>
    <p>Запрос на выход пришёл с другого сайта, поэтому он не выполнен автоматически.</p>
    <p><a href="${ROUTES.signout}">Выйти из аккаунта</a></p>
  </body>
</html>
`;

/**
 * Ends the session and sends the user to the login page. Server Components can't delete cookies, so a
 * dead session is redirected here. It is a GET with a side effect, so a request that another site
 * triggered (a link or image there) must not log the user out without a click on our own page.
 */
export async function GET(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  // Browsers always send it: "same-origin" is our own redirect or click, "none" a typed or bookmarked URL.
  if (site && site !== 'same-origin' && site !== 'none') {
    return new NextResponse(CONFIRM_PAGE, {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  await endSession();
  return NextResponse.redirect(new URL(ROUTES.login, request.url));
}
