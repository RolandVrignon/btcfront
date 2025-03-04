import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Protéger les routes du dashboard
  if (req.nextUrl.pathname.startsWith("/dashboard") && !isAuthenticated) {
    const url = new URL("/auth/signin", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Rediriger les utilisateurs authentifiés vers le dashboard s'ils tentent d'accéder à la page de connexion
  if (req.nextUrl.pathname === "/auth/signin" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/signin"],
};
