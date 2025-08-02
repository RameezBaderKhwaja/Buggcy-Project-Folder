import { NextResponse } from "next/server"

export const runtime = "nodejs"

// TODO: Add CSRF/origin check middleware if needed for extra security

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })

  // Set-Cookie header for Node.js runtime compatibility
  response.headers.append(
    "Set-Cookie",
    "auth-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  )

  return response
}
