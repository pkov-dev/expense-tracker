// Server-only entry point: `authorizedRequest` reads the session cookie, so it must never reach a client bundle.
export { authorizedRequest } from './authorized-request';
