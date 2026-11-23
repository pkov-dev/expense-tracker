/** Seconds until the JWT expires, read from its `exp` claim (no signature check — display/cookie lifetime only). */
export function getJwtTtlSeconds(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()) as {
      exp?: number;
    };
    if (typeof payload.exp !== 'number') return null;
    return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
  } catch {
    return null;
  }
}
