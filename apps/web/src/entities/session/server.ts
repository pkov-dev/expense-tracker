// The whole slice is server-only (cookies), so it has no client-safe `index.ts`: import from '@/entities/session/server'.
export { createSession, destroySession, endSession, sessionCookies } from './model/session';
