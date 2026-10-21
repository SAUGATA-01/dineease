import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/jwt";

const rules = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/dashboard", roles: ["RESTAURANT"] },
  { prefix: "/my-bookings", roles: ["CUSTOMER"] },
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const rule = rules.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (!rule) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/my-bookings/:path*"],
};