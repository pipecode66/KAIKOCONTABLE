import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { TreasurySubnav } from "@/modules/treasury/ui/components/treasury-subnav";
import type { TreasuryBalanceSnapshotDto } from "@/modules/treasury/dto/treasury.dto";

type CashStatePageProps = {
  organizationSlug: string;
  organizationName: string;
  snapshot: TreasuryBalanceSnapshotDto;
  formatMoney: (value: string) => string;
};

export function CashStatePage({
  organizationSlug,
  organizationName,
  snapshot,
  formatMoney,
}: CashStatePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesoreria"
        title="Estado de caja y bancos"
        description="Lectura consolidada de liquidez real calculada desde pagos y traslados publicados."
        badge={organizationName}
        actions={<TreasurySubnav organizationSlug={organizationSlug} activeKey="cash-state" />}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <BaseDataTable
          title="Bancos"
          description="Saldo operativo por cuenta bancaria activa."
          rows={snapshot.bankBalances}
          columns={[
            { key: "code", title: "Codigo" },
            { key: "name", title: "Cuenta" },
            {
              key: "balance",
              title: "Saldo",
              render: (row) => formatMoney(row.balance),
            },
          ]}
        />

        <BaseDataTable
          title="Cajas"
          description="Saldo operativo por caja activa."
          rows={snapshot.cashBalances}
          columns={[
            { key: "code", title: "Codigo" },
            { key: "name", title: "Caja" },
            {
              key: "balance",
              title: "Saldo",
              render: (row) => formatMoney(row.balance),
            },
          ]}
        />
      </div>
    </div>
  );
}
