import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken, createAuthCookie } from "@/lib/auth"

interface GitHubUser {
  id: number
  login: string
  email: string | null
  name: string
  avatar_url: string
}

export const runtime = "nodejs"
// TODO: Add CSRF state parameter handling for OAuth security

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url))
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    const githubUser = (await userResponse.json()) as GitHubUser

    // Handle null email from GitHub
    let email = githubUser.email

if (!email) {
  // Try fetching user emails if email is null
  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
    },
  })

  const emails = (await emailResponse.json()) as { email: string; primary: boolean; verified: boolean }[]

  const primaryEmail = emails.find((e) => e.primary && e.verified)
  email = primaryEmail?.email ?? null
}

if (!email) {
  return NextResponse.redirect(new URL("/login?error=no_email_from_github", request.url))
}


    // Check if user exists by email or providerId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { providerId: githubUser.id.toString() },
        ],
      },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: githubUser.name || githubUser.login,
          image: githubUser.avatar_url,
          provider: "github",
          providerId: githubUser.id.toString(),
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
    console.error("GitHub OAuth error:", error)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url))
  }
}
