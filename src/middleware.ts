import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLogin = pathname.startsWith("/login");

  if (!req.auth && !isLogin && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // Only bounce away from login when the session looks usable. A JWT can
  // outlive a wiped DB; requireUser clears that via signout.
  if (req.auth && isLogin && !req.nextUrl.searchParams.has("callbackUrl")) {
    return NextResponse.redirect(new URL("/week", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
