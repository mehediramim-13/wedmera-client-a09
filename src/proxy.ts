import { NextResponse, type NextRequest } from "next/server";

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => /^(?:__Secure-)?better-auth\.session_token(?:\.\d+)?$/.test(name));
}

export function proxy(request: NextRequest) {
  if (hasSessionCookie(request)) return NextResponse.next();

  const redirect = new URL("/signin", request.url);
  redirect.searchParams.set(
    "redirect",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(redirect);
}

export const config = {
  matcher: ["/dashboard/:path*", "/payment/:path*"],
};
