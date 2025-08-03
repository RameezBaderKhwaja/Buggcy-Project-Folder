import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken, createAuthCookie } from "@/lib/auth"

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
  verified_email: boolean
}

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    // Check for required env vars
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXT_PUBLIC_API_URL) {
      console.error("Missing Google OAuth env vars")
      return NextResponse.redirect(new URL("/login?error=server_config", request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url))
    }

    // CSRF state verification (if state was set in initiation step)
    const cookies = request.cookies
    const expectedState = cookies.get("google_oauth_state")?.value
    if (expectedState && state !== expectedState) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url))
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/google/callback`,
      }),
    })

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string }

    if (tokenData.error) {
      console.error("Google token exchange error:", tokenData.error, tokenData.error_description)
      return NextResponse.redirect(new URL(`/login?error=token_exchange_failed&desc=${encodeURIComponent(tokenData.error_description || "")}`, request.url))
    }

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
    }

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error("Failed to fetch Google user info", await userResponse.text())
      return NextResponse.redirect(new URL("/login?error=userinfo_failed", request.url))
    }

    const googleUser = (await userResponse.json()) as GoogleUser

    // Check for verified email
    if (!googleUser.verified_email) {
      return NextResponse.redirect(new URL("/login?error=email_not_verified", request.url))
    }

    // Check if user exists by email or providerId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: googleUser.email },
          { providerId: googleUser.id },
        ],
      },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          provider: "google",
          providerId: googleUser.id,
        },
      })
    }

    // Generate token with minimal payload
    const token = generateToken({ id: user.id, email: user.email, role: user.role })
    const cookie = createAuthCookie(token)

    const response = NextResponse.redirect(new URL("/dashboard", request.url))
    // Set cookie using headers for Node.js runtime compatibility
     response.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      httpOnly: true,
      sameSite: "lax",
      maxAge: cookie.maxAge,
      secure: process.env.NODE_ENV === "production",
    })

    return response
  } catch (error: unknown) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url))
  }
}
