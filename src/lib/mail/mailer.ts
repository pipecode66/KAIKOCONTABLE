import { logger } from "@/lib/observability/logger";

type MailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail(input: MailInput) {
  logger.info({ mail: { to: input.to, subject: input.subject } }, "Mail queued for delivery");
  return {
    accepted: [input.to],
  };
}
