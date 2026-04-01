import { randomUUID } from "node:crypto";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  createPersistedSession,
  revokePersistedSession,
  touchPersistedSession,
} from "@/lib/auth/persisted-session";
import { getAuthEnv } from "@/lib/env/server";
import { logger } from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { loginWithCredentials } from "@/modules/auth/application/use-cases/login-with-credentials";
import { loginSchema } from "@/modules/auth/validators/login.validator";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_UPDATE_AGE = 60 * 60 * 6;

function createAuthConfig(): NextAuthConfig {
  const env = getAuthEnv();

  return {
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
            label: "Contrasena",
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
            logger.warn({ error, email: parsed.data.email }, "Failed credentials login attempt");

            await writeAuditLog({
              actorUserId: null,
              action: "FAILED_LOGIN",
              entityType: "User",
              metadata: {
                email: parsed.data.email,
              },
            });

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
      async signIn(message) {
        await writeAuditLog({
          actorUserId: message.user.id,
          action: "LOGIN",
          entityType: "Session",
          entityId: message.user.id,
        });
      },
      async signOut(message) {
        if ("token" in message && message.token?.sessionToken) {
          await revokePersistedSession(message.token.sessionToken);
        }

        const actorUserId =
          "token" in message ? (message.token?.sub ?? message.token?.userId ?? null) : null;

        await writeAuditLog({
          actorUserId,
          action: "LOGOUT",
          entityType: "Session",
          entityId: actorUserId,
        });
      },
    },
  } satisfies NextAuthConfig;
}

export const { auth, handlers, signIn, signOut } = NextAuth(createAuthConfig);
