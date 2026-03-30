import { DomainError } from "@/lib/errors";

export function assertVersion(current: number, expected: number) {
  if (current !== expected) {
    throw new DomainError(
      "El registro cambió mientras era editado. Recarga antes de continuar.",
      "CONCURRENCY_CONFLICT",
    );
  }
}
