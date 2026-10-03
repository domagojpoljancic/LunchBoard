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

  if (req.auth && isLogin) {
    return NextResponse.redirect(new URL("/week", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
