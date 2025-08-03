import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  // Check for required env vars
  if (!process.env.GITHUB_CLIENT_ID || !process.env.NEXT_PUBLIC_API_URL) {
    console.error("Missing OAuth env vars");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/github/callback`);
  githubAuthUrl.searchParams.set("scope", "user:email");
  githubAuthUrl.searchParams.set("state", state);
  githubAuthUrl.searchParams.set("allow_signup", "true");

  console.debug("Redirecting to GitHub OAuth:", githubAuthUrl.toString());

  // Set state in cookie for later verification in callback
  const response = NextResponse.redirect(githubAuthUrl.toString());
  response.headers.append(
    "Set-Cookie",
    `github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
  return response;
}
