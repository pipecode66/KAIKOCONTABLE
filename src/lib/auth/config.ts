import { randomUUID } from "node:crypto";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/lib/env/server";
import {
  createPersistedSession,
  revokePersistedSession,
  touchPersistedSession,
} from "@/lib/auth/persisted-session";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/observability/logger";
import { loginWithCredentials } from "@/modules/auth/application/use-cases/login-with-credentials";
import { loginSchema } from "@/modules/auth/validators/login.validator";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_UPDATE_AGE = 60 * 60 * 6;

const authConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  pages: {
    signIn: "/login",
  },
  secret: env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        try {
          const user = await loginWithCredentials(parsed.data.email, parsed.data.password);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          logger.warn({ error }, "Failed credentials login attempt");
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.userId = user.id;
        token.sub = user.id;
      }

      if (trigger === "signIn" && user?.id) {
        const sessionToken = randomUUID();
        token.sessionToken = sessionToken;

        await createPersistedSession({
          userId: user.id,
          sessionToken,
          maxAgeSeconds: SESSION_MAX_AGE,
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? token.userId ?? "";
      }

      if (token.sessionToken) {
        await touchPersistedSession(token.sessionToken, SESSION_MAX_AGE);
      }

      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionToken) {
        await revokePersistedSession(message.token.sessionToken);
      }
    },
  },
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
