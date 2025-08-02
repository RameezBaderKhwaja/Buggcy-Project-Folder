import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
const protectedRoutes = ["/dashboard", "/profile", "/settings", "/users", "/security"]
const authRoutes = ["/login", "/register"]
const publicRoutes = ["/home", "/"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route)

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If it's a protected route and no token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && token) {
    // Verify token to get user role
    const payload = verifyToken(token)
    if (payload) {
      const redirectUrl = payload.role === "ADMIN" ? "/dashboard" : "/profile"
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
