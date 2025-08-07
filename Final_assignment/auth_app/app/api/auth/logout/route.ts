import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {

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
