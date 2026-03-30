import { PrismaClient } from "@prisma/client";

import { getDatabaseEnv } from "@/lib/env/server";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaProxy: PrismaClient | undefined;
}

function createPrismaClient() {
  getDatabaseEnv();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrisma() {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }

  return globalThis.prisma;
}

export const prisma =
  globalThis.prismaProxy ??
  new Proxy({} as PrismaClient, {
    get(_target, prop) {
      const client = getPrisma();
      const value = client[prop as keyof PrismaClient];

      return typeof value === "function" ? value.bind(client) : value;
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaProxy = prisma;
}
