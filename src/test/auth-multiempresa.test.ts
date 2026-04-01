import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "@/modules/auth/domain/services/password.service";
import { resetPasswordSchema } from "@/modules/auth/validators/reset-password.validator";
import { organizationSettingsSchema } from "@/modules/organizations/validators/organization-settings.validator";
import { permissionCatalog, rolePermissionMatrix } from "@/lib/permissions/permissions";

test("password service hashes and verifies credentials", async () => {
  const hash = await hashPassword("KaikoTest2026!");

  assert.ok(hash);
  assert.equal(await verifyPassword("KaikoTest2026!", hash), true);
  assert.equal(await verifyPassword("otra-clave", hash), false);
});

test("organization settings validator rejects invalid fiscal month", () => {
  assert.throws(() =>
    organizationSettingsSchema.parse({
      timezone: "America/Bogota",
      locale: "es-CO",
      fiscalYearStartMonth: 13,
      numberFormat: "es-CO-currency",
      dateFormat: "dd/MM/yyyy",
    }),
  );
});

test("reset password validator rejects mismatched passwords", () => {
  assert.throws(() =>
    resetPasswordSchema.parse({
      token: "token-super-seguro-de-prueba-123456789",
      password: "KaikoTest2026!",
      confirmPassword: "KaikoMismatch2026!",
    }),
  );
});

test("permission matrix preserves multi-tenant access boundaries", () => {
  assert.ok(permissionCatalog.some((permission) => permission.code === "organizations.manage"));
  assert.ok(rolePermissionMatrix.admin.includes("organizations.manage"));
  assert.ok(rolePermissionMatrix.viewer.includes("organizations.read"));
  assert.equal(rolePermissionMatrix.viewer.includes("admin.manage"), false);
});
