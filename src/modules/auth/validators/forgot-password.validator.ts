import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo valido."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
