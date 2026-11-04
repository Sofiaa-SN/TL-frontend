import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { isStaffPath } from "@/lib/auth/continuation";

const STAFF_SESSION_COOKIES = ["tella_admin_access", "tella_admin_refresh"];
const LEARNER_SESSION_COOKIES = ["tella_learner_access", "tella_learner_refresh"];

function hasSession(request: NextRequest, names: string[]) {
  return names.some((name) => Boolean(request.cookies.get(name)?.value));
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/learn/login";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/learn/login";
    return NextResponse.redirect(url);
  }

  const isLearnerRoute = (request.nextUrl.pathname === "/learn" || request.nextUrl.pathname.startsWith("/learn/"))
    && request.nextUrl.pathname !== "/learn/login";
  if (isLearnerRoute && !hasSession(request, LEARNER_SESSION_COOKIES)) {
    return loginRedirect(request);
  }
  if (isStaffPath(request.nextUrl.pathname) && !hasSession(request, STAFF_SESSION_COOKIES)) {
    return loginRedirect(request);
  }

  if (!auth0) return NextResponse.next();
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sofiaa-logo.png|sofiaa-logo-inverse.png|sofiaa-mark.png|icon.png|apple-icon.png).*)",
  ],
};
