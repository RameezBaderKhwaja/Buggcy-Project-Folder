import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken, createAuthCookie } from "@/lib/auth"

interface GitHubUser {
  id: number
  login: string
  email: string
  name: string
  avatar_url: string
}

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

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: githubUser.email },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: githubUser.email,
          name: githubUser.name || githubUser.login,
          image: githubUser.avatar_url,
          provider: "github",
          providerId: githubUser.id.toString(),
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
    console.error("GitHub OAuth error:", error)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url))
  }
}
