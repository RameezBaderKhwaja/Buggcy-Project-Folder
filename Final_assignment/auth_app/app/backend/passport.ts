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
  StrategyOptions as GitHubStrategyOptions,
} from "passport-github2";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/types";
import type { Request } from "express";

// ==========================
// Extended type for passport
// ==========================
export interface PassportUser extends AuthUser {
  provider: string;
}

// ==============
// Helper: Clean
// ==============
const sanitizeUser = (user: Partial<AuthUser> & { password?: string | null }): PassportUser => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword as PassportUser;
};

// ===================
// Local Strategy
// ===================
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
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
      } catch (error) {
        console.error("Local strategy error:", error);
        return done(error as Error);
      }
    }
  )
);

// ===================
// Google Strategy
// ===================
const googleStrategyOptions: GoogleStrategyOptionsWithRequest = {
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL: "/api/auth/oauth/google/callback",
  passReqToCallback: true,
};

passport.use(
  new GoogleStrategy(
    googleStrategyOptions,
    async (
      req: Request,
      accessToken: string,
      _refreshToken: string,
      _params: unknown,
      profile: GoogleProfile,
      done: GoogleVerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error("No email found in Google profile"));

        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          if (user.provider !== "google") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: "google",
                image: profile.photos?.[0]?.value || user.image,
              },
            });
          }
        } else {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.name?.givenName || email.split("@")[0],
              provider: "google",
              image: profile.photos?.[0]?.value,
            },
          });
        }

        return done(null, sanitizeUser(user));
      } catch (error) {
        console.error("Google strategy error:", error);
        return done(error as Error);
      }
    }
  )
);

// ===================
// GitHub Strategy
// ===================
const githubStrategyOptions: GitHubStrategyOptions = {
  clientID: process.env.GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  callbackURL: "/api/auth/oauth/github/callback",
};

passport.use(
  new GitHubStrategy(
    githubStrategyOptions,
    async (
      accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: (error: unknown, user?: Express.User | false | null) => void
    ) => {
      try {
        const rawEmail = profile.emails?.find((emailObj) => {
          return (emailObj as { value: string; primary?: boolean }).primary || false;
        })?.value || profile.emails?.[0]?.value;

        const email = rawEmail?.toLowerCase();
        if (!email) return done(new Error("No email found in GitHub profile"));

        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          if (user.provider !== "github") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: "github",
                image: profile.photos?.[0]?.value || user.image,
              },
            });
          }
        } else {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username || email.split("@")[0],
              provider: "github",
              image: profile.photos?.[0]?.value,
            },
          });
        }

        return done(null, sanitizeUser(user));
      } catch (error) {
        console.error("GitHub strategy error:", error);
        return done(error as Error);
      }
    }
  )
);

// ===================
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
        createdAt: true,
        updatedAt: true,
      },
    });
    done(null, user ? (user as PassportUser) : null);
  } catch (error) {
    done(error);
  }
});

export default passport;
