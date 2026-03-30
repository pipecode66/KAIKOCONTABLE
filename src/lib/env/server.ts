import { z } from "zod";

const optionalSecret = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim() === "" ? undefined : value;
}, z.string().min(8).optional());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url(),
  APP_URL: z.string().url(),
  INTERNAL_CRON_TOKEN: z.string().min(8),
  CRON_SECRET: optionalSecret,
  MAIL_FROM: z.string().email(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

function readEnvSource() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    APP_URL: process.env.APP_URL,
    INTERNAL_CRON_TOKEN: process.env.INTERNAL_CRON_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    MAIL_FROM: process.env.MAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  };
}

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(readEnvSource());
  }

  return cachedEnv;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    return getEnv()[prop as keyof ServerEnv];
  },
});
