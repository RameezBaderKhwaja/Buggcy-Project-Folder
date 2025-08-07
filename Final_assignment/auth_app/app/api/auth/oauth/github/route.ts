import { NextResponse } from "next/server"
import { GITHUB_CONFIG, BASE_URL } from "@/lib/config"

export const runtime = "edge"

export async function GET() {

  if (!GITHUB_CONFIG.CLIENT_ID || !BASE_URL) {
    console.error("Missing OAuth env vars");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  const state = crypto.randomUUID();

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CONFIG.CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", `${BASE_URL}/api/auth/oauth/github/callback`);
  githubAuthUrl.searchParams.set("scope", "user:email");
  githubAuthUrl.searchParams.set("state", state);
  githubAuthUrl.searchParams.set("allow_signup", "true");

  console.debug("Redirecting to GitHub OAuth:", githubAuthUrl.toString());

  const response = NextResponse.redirect(githubAuthUrl.toString());
  response.headers.append(
    "Set-Cookie",
    `github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
  return response;
}
