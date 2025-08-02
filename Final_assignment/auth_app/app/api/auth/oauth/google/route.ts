import { NextResponse } from "next/server"

export const runtime = "edge"

function base64URLEncode(str: ArrayBuffer) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE() {
  const code_verifier = crypto.randomUUID().replace(/-/g, "");
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const code_challenge = base64URLEncode(hashBuffer);
  return { code_verifier, code_challenge };
}

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_API_URL) {
    console.error("Missing Google OAuth env vars");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();
  // Generate PKCE code_verifier and code_challenge
  const { code_verifier, code_challenge } = await generatePKCE();

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/google/callback`);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("code_challenge", code_challenge);
  googleAuthUrl.searchParams.set("code_challenge_method", "S256");
  googleAuthUrl.searchParams.set("access_type", "offline"); // for refresh tokens

  console.debug("Google OAuth URL:", googleAuthUrl.toString());

  // Set state and code_verifier in cookies for later verification in callback
  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.headers.append(
    "Set-Cookie",
    `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
  response.headers.append(
    "Set-Cookie",
    `google_pkce_verifier=${code_verifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
  return response;
}
