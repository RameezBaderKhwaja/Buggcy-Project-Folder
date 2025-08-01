import { NextResponse } from "next/server"

export async function GET() {
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
  githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID || "")
  githubAuthUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/github/callback`)
  githubAuthUrl.searchParams.set("scope", "user:email")
  githubAuthUrl.searchParams.set("state", "github_oauth")

  return NextResponse.redirect(githubAuthUrl.toString())
}
