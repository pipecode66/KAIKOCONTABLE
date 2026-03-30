import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().optional());

const optionalSecret = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().min(8).optional());

const optionalPort = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.coerce.number().int().positive().optional());

const rawEnvSchema = z.object({
  DATABASE_URL: optionalString,
  AUTH_SECRET: optionalString,
  NEXTAUTH_URL: optionalUrl,
  APP_URL: optionalUrl,
  INTERNAL_CRON_TOKEN: optionalSecret,
  CRON_SECRET: optionalSecret,
  MAIL_FROM: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalPort,
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
});

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: optionalUrl,
  APP_URL: optionalUrl,
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const cronEnvSchema = z.object({
  INTERNAL_CRON_TOKEN: optionalSecret,
  CRON_SECRET: optionalSecret,
});

const mailEnvSchema = z.object({
  MAIL_FROM: z.string().email(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
});

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

let cachedRawEnv: z.infer<typeof rawEnvSchema> | null = null;
let cachedAuthEnv: z.infer<typeof authEnvSchema> | null = null;
let cachedDatabaseEnv: z.infer<typeof databaseEnvSchema> | null = null;
let cachedCronEnv: z.infer<typeof cronEnvSchema> | null = null;
let cachedMailEnv: z.infer<typeof mailEnvSchema> | null = null;

export function getRawEnv() {
  if (!cachedRawEnv) {
    cachedRawEnv = rawEnvSchema.parse(readEnvSource());
  }

  return cachedRawEnv;
}

export function getAuthEnv() {
  if (!cachedAuthEnv) {
    cachedAuthEnv = authEnvSchema.parse(getRawEnv());
  }

  return cachedAuthEnv;
}

export function getDatabaseEnv() {
  if (!cachedDatabaseEnv) {
    cachedDatabaseEnv = databaseEnvSchema.parse(getRawEnv());
  }

  return cachedDatabaseEnv;
}

export function getCronEnv() {
  if (!cachedCronEnv) {
    cachedCronEnv = cronEnvSchema.parse(getRawEnv());
  }

  return cachedCronEnv;
}

export function getMailEnv() {
  if (!cachedMailEnv) {
    cachedMailEnv = mailEnvSchema.parse(getRawEnv());
  }

  return cachedMailEnv;
}
