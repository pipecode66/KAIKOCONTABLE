"use server";

import { ZodError } from "zod";
import { redirect } from "next/navigation";

import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import type { PasswordResetActionState } from "@/modules/auth/dto/password-reset.dto";
import { consumePasswordReset } from "@/modules/auth/application/use-cases/consume-password-reset";
import { requestPasswordReset } from "@/modules/auth/application/use-cases/request-password-reset";
import { forgotPasswordSchema } from "@/modules/auth/validators/forgot-password.validator";
import { resetPasswordSchema } from "@/modules/auth/validators/reset-password.validator";

const defaultActionState: PasswordResetActionState = {
  success: false,
  message: "",
};

function buildActionError(error: unknown): PasswordResetActionState {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los datos del formulario e intenta de nuevo.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  if (error instanceof DomainError || error instanceof KaikoError) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: false,
    message: "No pudimos completar la operacion. Intenta nuevamente.",
  };
}

export async function requestPasswordResetAction(
  previousState: PasswordResetActionState = defaultActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  void previousState;

  try {
    const payload = forgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    const result = await requestPasswordReset(payload.email);

    return {
      success: true,
      message:
        "Si el correo existe en KAIKO, te enviamos instrucciones para recuperar el acceso.",
      debugResetUrl: result.debugResetUrl,
    };
  } catch (error) {
    logger.error({ error }, "Failed to request password reset");
    return buildActionError(error);
  }
}

export async function resetPasswordAction(
  previousState: PasswordResetActionState = defaultActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  void previousState;

  try {
    const payload = resetPasswordSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    await consumePasswordReset(payload.token, payload.password);
  } catch (error) {
    logger.error({ error }, "Failed to reset password");
    return buildActionError(error);
  }

  redirect("/login?reset=success");
}
