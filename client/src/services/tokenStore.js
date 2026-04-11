/**
 * In-memory access token store.
 *
 * WHY in-memory?
 *   - localStorage/sessionStorage are vulnerable to XSS attacks.
 *   - HTTP-only cookies can't be read by JS (good for refresh token).
 *   - Memory is cleared on tab close / page refresh, which is fine because
 *     the refresh token cookie silently re-issues a new access token.
 *
 * The refresh token lives in an HTTP-only cookie (set by the server).
 * The access token lives here — never touches the DOM or storage.
 */

let _accessToken = null;

const tokenStore = {
  get:   ()      => _accessToken,
  set:   (token) => { _accessToken = token; },
  clear: ()      => { _accessToken = null; },
};

export default tokenStore;
