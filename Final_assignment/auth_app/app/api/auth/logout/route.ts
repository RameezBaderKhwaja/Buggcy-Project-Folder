import { NextResponse } from "next/server"

export const runtime = "nodejs"

// TODO: Add CSRF/origin check middleware if needed for extra security

export async function POST() {
  // DUPLICATE CODE: Response formatting pattern
  // This response structure is repeated across multiple API routes
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })

  // Clear authentication token by setting expired cookie
  response.headers.append(
    "Set-Cookie",
    "auth-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  )

  return response
}
