import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string; // "super_admin" | "user"
      portfolioId?: string | null; // Portfolio ID for the logged-in user
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email (include role)
        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
          },
        });

        if (!user) {
          // Prevent timing attacks by hashing a dummy password
          await bcrypt.hash("dummy", 10);
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // Fetch user's portfolio (if exists) for session
        // Safe lookup - returns null if Portfolio model doesn't exist yet (pre-migration)
        let portfolioId: string | null = null;
        try {
          // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
          const portfolio = await prisma.portfolio.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          portfolioId = portfolio?.id || null;
        } catch (error) {
          // Portfolio model doesn't exist yet - this is OK, will work after migration
          portfolioId = null;
        }

        // Return user object (will be stored in session)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "user", // Default to "user" if role not set
          portfolioId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || "user";
        // Store portfolioId in token (from authorize or refresh if needed)
        if ("portfolioId" in user) {
          token.portfolioId = user.portfolioId as string | null;
        }
      }
      // Refresh role if missing (e.g., after role update)
      // Safe lookup - role field may not exist in Prisma Client until migration
      if (!token.role && token.id) {
        try {
          // @ts-expect-error - role field may not exist in Prisma Client until migration
          const user = await prisma.adminUser.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          token.role = user?.role || "user";
        } catch (error) {
          // Role field doesn't exist yet - default to "user"
          token.role = "user";
        }
      }
      // Refresh portfolioId if not in token (e.g., after portfolio creation)
      // Safe lookup - returns null if Portfolio model doesn't exist yet (pre-migration)
      if (!token.portfolioId && token.id) {
        try {
          // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
          const portfolio = await prisma.portfolio.findUnique({
            where: { userId: token.id as string },
            select: { id: true },
          });
          token.portfolioId = portfolio?.id || null;
        } catch (error) {
          // Portfolio model doesn't exist yet - this is OK
          token.portfolioId = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.role = (token.role as string) || "user";
        session.user.portfolioId = (token.portfolioId as string | null) || null;
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
  trustHost: true, // Required for Vercel deployment
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
