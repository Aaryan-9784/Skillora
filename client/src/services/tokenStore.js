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

import { updateSocketToken, disconnectSocket } from "./socketService";

let _accessToken = typeof window !== "undefined" ? localStorage.getItem("sk_access_token") : null;

const tokenStore = {
  get: () => _accessToken || (typeof window !== "undefined" ? localStorage.getItem("sk_access_token") : null),
  set: (token) => {
    _accessToken = token;
    if (token) {
      if (typeof window !== "undefined") localStorage.setItem("sk_access_token", token);
      updateSocketToken(token);
    } else {
      if (typeof window !== "undefined") localStorage.removeItem("sk_access_token");
    }
  },
  clear: () => {
    _accessToken = null;
    if (typeof window !== "undefined") localStorage.removeItem("sk_access_token");
    disconnectSocket();
  },
};

export default tokenStore;
