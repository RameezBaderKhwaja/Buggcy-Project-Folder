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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url))
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

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
    }

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const googleUser = (await userResponse.json()) as GoogleUser

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
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

    // Generate token and set cookie
    const token = generateToken(user)
    const cookie = createAuthCookie(token)

    const response = NextResponse.redirect(new URL("/dashboard", request.url))
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge,
      path: cookie.path,
    })

    return response
  } catch (error: unknown) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url))
  }
}
