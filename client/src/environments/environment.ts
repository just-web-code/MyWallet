/**
 * API base for the MyWallet (JWC) backend.
 *
 * In dev this stays a same-origin path: `proxy.conf.json` forwards `/api/*`
 * to the JWC server (default http://localhost:7889), so no CORS setup is
 * needed. For a real deployment point `apiUrl` at the public API origin.
 */
export const environment = {
  apiUrl: '/api',
};
