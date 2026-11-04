import "server-only";

import { createDjangoSession, type SessionAuthMethod, type TokenPair } from "./django-session";

export type LearnerTokenPair = TokenPair;
export type LearnerAuthMethod = SessionAuthMethod;

const session = createDjangoSession({
  access: "tella_learner_access",
  refresh: "tella_learner_refresh",
  authMethod: "tella_learner_auth_method",
});

export const setLearnerSession = session.setSession;
export const clearLearnerSession = session.clearSession;
export const learnerDjangoRequest = session.request;
export const learnerRefreshToken = session.refreshToken;
export const learnerAuthMethod = session.authMethod;
