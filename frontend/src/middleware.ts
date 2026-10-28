import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sokolink_super_secret_jwt_key_kenya_ecommerce_2026_xyz"
);

const COOKIE_NAME = "sokolink_session";

interface SessionUser {
  userId: string;
  email: string;
  role: "ADMIN" | "SME" | "DELIVERY" | "CUSTOMER";
  name: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public exceptions
  if (
    pathname === "/admin/login" ||
    pathname === "/rider/login" ||
    pathname === "/delivery/login" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  let user: SessionUser | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as unknown as SessionUser;
    } catch {
      user = null;
    }
  }

  // 1. ADMIN ROUTES
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login?error=forbidden", request.url));
    }
    return NextResponse.next();
  }

  // 2. DELIVERY / RIDER ROUTES
  if (pathname.startsWith("/delivery") || pathname.startsWith("/rider")) {
    if (!user) {
      const loginUrl = new URL("/rider/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "DELIVERY" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/rider/login?error=forbidden", request.url));
    }
    return NextResponse.next();
  }

  // 3. SME ROUTES
  if (pathname.startsWith("/sme")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "SME" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
    }
    return NextResponse.next();
  }

  // 4. CUSTOMER ACCOUNT ROUTES
  if (pathname.startsWith("/customer")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/delivery/:path*",
    "/rider/:path*",
    "/sme/:path*",
    "/customer/:path*",
  ],
};
