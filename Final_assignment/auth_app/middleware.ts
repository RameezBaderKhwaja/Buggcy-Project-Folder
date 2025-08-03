import { type NextRequest, NextResponse } from "next/server"

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
    return NextResponse.redirect(new URL("/home", request.url))
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && token) {
    // Instead of verifying the token, we just check if it exists
    // The actual token verification will happen in the API routes
    // For now, we'll redirect to a default dashboard page
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
