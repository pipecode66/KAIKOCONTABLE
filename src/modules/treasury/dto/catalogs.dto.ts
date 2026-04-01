export type TreasuryCatalogKey = "payment-methods" | "bank-accounts" | "cash-accounts";

export const treasuryCatalogMeta: Record<
  TreasuryCatalogKey,
  { title: string; description: string }
> = {
  "payment-methods": {
    title: "Metodos de pago",
    description:
      "Maestro operativo para cobros, pagos y conciliacion con codigos consistentes por organizacion.",
  },
  "bank-accounts": {
    title: "Cuentas bancarias",
    description:
      "Catalogo bancario para tesoreria, conciliacion y movimientos intercuenta dentro del MVP monomoneda.",
  },
  "cash-accounts": {
    title: "Cajas",
    description:
      "Cajas operativas para arqueo, movimientos manuales y trazabilidad de disponibilidades de efectivo.",
  },
};
