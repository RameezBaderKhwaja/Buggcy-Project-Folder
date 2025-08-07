import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  StrategyOptionsWithRequest as GoogleStrategyOptionsWithRequest,
  VerifyCallback as GoogleVerifyCallback,
} from "passport-google-oauth20";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
  StrategyOptionsWithRequest as GitHubStrategyOptionsWithRequest,
  StrategyOptions as GitHubStrategyOptions,
} from "passport-github2";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/types";
import type { Request } from "express";
import { logSecurityEvent } from "@/lib/security";

// Extend Request interface for session support
declare module "express-serve-static-core" {
  interface Request {
    session?: {
      oauthState?: string;
      [key: string]: any;
    };
  }
}

// Environment validation

const validateEnvironmentVariables = () => {
  const requiredVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }

  // Validate callback URL format
  try {
    new URL(process.env.NEXT_PUBLIC_API_URL!);
  } catch (error) {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid URL");
  }
};

// Validate environment on module load
validateEnvironmentVariables();

const callbackBaseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.NEXT_PUBLIC_API_URL;

// Extended type for passport
export interface PassportUser extends AuthUser {
  provider: string;
}

// Extend Express User interface using module augmentation 
declare module "express-serve-static-core" {
  interface User extends PassportUser {}
}

// Clean and sanitize user data
const sanitizeUser = (user: Partial<AuthUser> & { 
  password?: string | null; 
  providerId?: string | null;
  [key: string]: any;
}): PassportUser => {
  // Remove sensitive fields
  const { 
    password, 
    ...sanitizedUser 
  } = user;

  // Ensure required fields are present
  if (!sanitizedUser.id || !sanitizedUser.email) {
    throw new Error("Invalid user data: missing required fields");
  }

  return sanitizedUser as PassportUser;
};

// State management for OAuth CSRF protection
const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const validateState = (req: Request, state: string): boolean => {
  if (!req.session) return false;
  const sessionState = req.session.oauthState;
  delete req.session.oauthState; // Clean up after use
  return sessionState === state;
};

// Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done: (error: Error | null, user?: Express.User | false, options?: { message: string }) => void) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, sanitizeUser(user));
      } catch (error: unknown) {
        console.error("Local strategy error:", error);
        return done(error as Error);
      }
    }
  )
);

// Google Strategy with enhanced security
const googleStrategyOptions: GoogleStrategyOptionsWithRequest = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${callbackBaseUrl}/auth/oauth/google/callback`,
  scope: ["profile", "email"],
  passReqToCallback: true,
};

passport.use(
  new GoogleStrategy(
    googleStrategyOptions,
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      params: unknown,
      profile: GoogleProfile,
      done: GoogleVerifyCallback
    ) => {
      try {
        // Log OAuth attempt for security monitoring
        await logSecurityEvent({
          type: "OAUTH_ATTEMPT",
          details: {
            provider: "google",
            profileId: profile.id,
            email: profile.emails?.[0]?.value,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "",
        }).catch(console.error);

        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          await logSecurityEvent({
            type: "OAUTH_ERROR",
            details: { provider: "google", error: "No email in profile" },
            ipAddress: req.ip || "unknown",
            userAgent: req.get("User-Agent") || "",
          }).catch(console.error);
          return done(new Error("No email found in Google profile"));
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Update existing user's OAuth info if needed
          if (user.provider !== "google") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: "google",
                providerId: profile.id,
                image: profile.photos?.[0]?.value || user.image,
              },
            });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.name?.givenName || email.split("@")[0],
              provider: "google",
              providerId: profile.id,
              image: profile.photos?.[0]?.value,
            },
          });
        }

        // Log successful OAuth
        await logSecurityEvent({
          type: "OAUTH_SUCCESS",
          details: {
            provider: "google",
            userId: user.id,
            isNewUser: !user.createdAt || 
              (new Date().getTime() - new Date(user.createdAt).getTime()) < 5000,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "",
        }).catch(console.error);

        return done(null, sanitizeUser(user));
      } catch (error: unknown) {
        console.error("Google strategy error:", error);
        await logSecurityEvent({
          type: "OAUTH_ERROR",
          details: {
            provider: "google",
            error: (error as Error).message,
            stack: (error as Error).stack,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "",
        }).catch(console.error);
        return done(error as Error);
      }
    }
  )
);

// GitHub Strategy with enhanced security
const githubStrategyOptions: GitHubStrategyOptionsWithRequest = {
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: `${callbackBaseUrl}/auth/oauth/github/callback`,
  scope: ["user:email"],
  passReqToCallback: true,
};

passport.use(
  new GitHubStrategy(
    githubStrategyOptions,
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: (error: Error | null, user?: Express.User | false) => void
    ) => {
      try {
        // Log OAuth attempt for security monitoring
        await logSecurityEvent({
          type: "OAUTH_ATTEMPT",
          details: {
            provider: "github",
            profileId: profile.id,
            username: profile.username,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "",
        }).catch(console.error);

        const rawEmail = profile.emails?.find((emailObj) => {
          return (emailObj as { value: string; primary?: boolean }).primary || false;
        })?.value || profile.emails?.[0]?.value;

        const email = rawEmail?.toLowerCase();
        if (!email) {
          await logSecurityEvent({
            type: "OAUTH_ERROR",
            details: { provider: "github", error: "No email in profile" },
            ipAddress: req.ip || "unknown",
            userAgent: req.get("User-Agent") || "",
          }).catch(console.error);
          return done(new Error("No email found in GitHub profile"));
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Update existing user's OAuth info if needed
          if (user.provider !== "github") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: "github",
                providerId: profile.id,
                image: profile.photos?.[0]?.value || user.image,
              },
            });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username || email.split("@")[0],
              provider: "github",
              providerId: profile.id,
              image: profile.photos?.[0]?.value,
            },
          });
        }

        // Log successful OAuth
        await logSecurityEvent({
          type: "OAUTH_SUCCESS",
          details: {
            provider: "github",
            userId: user.id,
            isNewUser: !user.createdAt || 
              (new Date().getTime() - new Date(user.createdAt).getTime()) < 5000,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "",
        }).catch(console.error);

        return done(null, sanitizeUser(user));
      } catch (error: unknown) {
        console.error("GitHub strategy error:", error);
        await logSecurityEvent({
          type: "OAUTH_ERROR",
          details: {
            provider: "github",
            error: (error as Error).message,
            stack: (error as Error).stack,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "",
        }).catch(console.error);
        return done(error as Error);
      }
    }
  )
);

// Serialize & Deserialize
// ===================
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as PassportUser).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        age: true,
        gender: true,
        provider: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // User no longer exists - force session cleanup
      await logSecurityEvent({
        type: "SESSION_ERROR",
        details: {
          error: "User not found during deserialization",
          userId: id,
        },
        ipAddress: "unknown",
        userAgent: "",
      }).catch(console.error);
      
      return done(new Error("User no longer exists"), null);
    }

    done(null, user as PassportUser);
  } catch (error: unknown) {
    console.error("Deserialize user error:", error);
    await logSecurityEvent({
      type: "SESSION_ERROR",
      details: {
        error: (error as Error).message,
        userId: id,
      },
      ipAddress: "unknown",
      userAgent: "",
    }).catch(console.error);
    done(error);
  }
});

export default passport;
