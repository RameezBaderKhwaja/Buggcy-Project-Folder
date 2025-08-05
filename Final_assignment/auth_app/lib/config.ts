if (typeof window !== "undefined") {
  throw new Error("Server-side config imported on the client.");
}

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = "7d";

export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

export const GITHUB_CONFIG = {
  CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
};

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

if (!BASE_URL) {
  console.warn("BASE_URL is not set in environment variables. OAuth flows may not work correctly.");
}

if (!JWT_SECRET) {
  console.warn("JWT_SECRET is not set in environment variables. Using a default, insecure key.");
}

if (!GOOGLE_CONFIG.CLIENT_ID || !GOOGLE_CONFIG.CLIENT_SECRET) {
  console.warn("Google OAuth configuration is incomplete.");
}

if (!GITHUB_CONFIG.CLIENT_ID || !GITHUB_CONFIG.CLIENT_SECRET) {
  console.warn("GitHub OAuth configuration is incomplete.");
}

if (!CLOUDINARY_CONFIG.CLOUD_NAME || !CLOUDINARY_CONFIG.API_KEY || !CLOUDINARY_CONFIG.API_SECRET) {
  console.warn("Cloudinary configuration is incomplete. Image uploads will likely fail.");
}
