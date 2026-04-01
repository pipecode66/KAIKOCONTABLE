import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, "El token de recuperacion no es valido."),
    password: z
      .string()
      .min(8, "La nueva contrasena debe tener al menos 8 caracteres.")
      .max(128, "La nueva contrasena es demasiado larga."),
    confirmPassword: z.string().min(8, "Confirma la nueva contrasena."),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden.",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
