export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Access cookie expires this much earlier than the JWT, so the proxy refreshes before the API answers 401. */
export const ACCESS_COOKIE_SKEW_SECONDS = 30;
