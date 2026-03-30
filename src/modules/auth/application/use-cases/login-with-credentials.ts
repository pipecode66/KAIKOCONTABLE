import { AuthorizationError } from "@/lib/errors";
import { findUserByEmail } from "@/modules/auth/infrastructure/repositories/user-auth.repository";
import { verifyPassword } from "@/modules/auth/domain/services/password.service";

export async function loginWithCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user?.credential || !user.isActive) {
    throw new AuthorizationError("Credenciales inválidas.");
  }

  const isValid = await verifyPassword(password, user.credential.passwordHash);

  if (!isValid) {
    throw new AuthorizationError("Credenciales inválidas.");
  }

  return user;
}
