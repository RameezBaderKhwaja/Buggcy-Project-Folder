import { NextResponse } from "next/server"
import { GITHUB_CONFIG, BASE_URL } from "@/lib/config"

export const runtime = "edge"

export async function GET() {
  // DUPLICATE CODE: Environment variable validation pattern
  // This validation pattern is repeated in multiple OAuth routes
  if (!GITHUB_CONFIG.CLIENT_ID || !BASE_URL) {
    console.error("Missing OAuth env vars");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  // DUPLICATE CODE: OAuth state generation pattern
  // This state generation logic is repeated in multiple OAuth routes
  const state = crypto.randomUUID();

  // DUPLICATE CODE: OAuth URL construction pattern
  // This URL construction logic is repeated in multiple OAuth routes
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CONFIG.CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", `${BASE_URL}/api/auth/oauth/github/callback`);
  githubAuthUrl.searchParams.set("scope", "user:email");
  githubAuthUrl.searchParams.set("state", state);
  githubAuthUrl.searchParams.set("allow_signup", "true");

  console.debug("Redirecting to GitHub OAuth:", githubAuthUrl.toString());

  // DUPLICATE CODE: OAuth state cookie setting pattern
  // This cookie setting logic is repeated in multiple OAuth routes
  const response = NextResponse.redirect(githubAuthUrl.toString());
  response.headers.append(
    "Set-Cookie",
    `github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
  return response;
}
