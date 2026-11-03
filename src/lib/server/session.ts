import "server-only";

import { createDjangoSession, type SessionAuthMethod, type TokenPair } from "./django-session";

export type { SessionAuthMethod, TokenPair };

const session = createDjangoSession({
  access: "tella_admin_access",
  refresh: "tella_admin_refresh",
  authMethod: "tella_admin_auth_method",
});

export const setSession = session.setSession;
export const clearSession = session.clearSession;
export const djangoRequest = session.request;
export const sessionRefreshToken = session.refreshToken;
export const sessionAuthMethod = session.authMethod;
