import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard (Next.js 16 "proxy", formerly middleware).
 * TODO (backend phase): read the NextAuth token, redirect unauthenticated
 * users to /login and enforce role-based access (RBAC) per route.
 */
export function proxy(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
