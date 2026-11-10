"use client";

import { Pencil, Phone, Receipt, WalletCards } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { BuyerEditForm } from "@/components/forms/buyer-edit-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { Button } from "@/components/ui/button";
import { formatCOP, formatDate } from "@/lib/format";
import type { AllocationSale } from "@/components/forms/allocation-editor";

export type BuyerDetailModel = {
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    document: string | null;
    phone: string;
    recommendedBy: string | null;
  };
  sales: Array<{
    id: string;
    palco: number;
    status: "activa" | "liberada";
    price: number;
    paid: number;
    balance: number;
    separatedAt: string;
    releasedAt: string | null;
    releaseReason: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    reference: string | null;
    note: string | null;
    cancelled: boolean;
    cancellationReason: string | null;
  }>;
  refunds: Array<{
    id: string;
    amount: number;
    date: string;
    reference: string | null;
    boxNumber: number;
  }>;
  activeSales: Array<AllocationSale & { paid: number; price: number }>;
};

export function BuyerDetail({ model }: { model: BuyerDetailModel }) {
  const router = useRouter();
  const [mode, setMode] = useState<"detail" | "edit" | "payment">("detail");
  const activeSales = model.activeSales;
  const total = model.sales.reduce((sum, sale) => sum + sale.price, 0);
  const paid = model.sales.reduce((sum, sale) => sum + sale.paid, 0);

  if (mode === "edit") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <BuyerEditForm
          buyer={model.buyer}
          onCancel={() => setMode("detail")}
          onSuccess={() => {
            setMode("detail");
            router.refresh();
          }}
        />
      </section>
    );
  }

  if (mode === "payment") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <PaymentForm
          buyerId={model.buyer.id}
          sales={activeSales}
          initialSaleId={activeSales[0]?.venta_id ?? ""}
          currentPaid={activeSales[0]?.paid ?? 0}
          currentPrice={activeSales[0]?.price ?? 0}
          onCancel={() => setMode("detail")}
          onSuccess={() => {
            setMode("detail");
            router.refresh();
          }}
        />
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              {model.buyer.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Documento: {model.buyer.document}
            </p>
            <a
              href={`tel:${model.buyer.phone}`}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 underline"
            >
              <Phone aria-hidden="true" size={16} />
              {model.buyer.phone}
            </a>
            {model.buyer.recommendedBy ? (
              <p className="mt-2 text-sm text-slate-600">
                Recomendado por: {model.buyer.recommendedBy}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMode("edit")}>
              <Pencil aria-hidden="true" size={16} />
              Editar comprador
            </Button>
            <Button
              onClick={() => setMode("payment")}
              disabled={!activeSales.length}
            >
              <WalletCards aria-hidden="true" size={16} />
              Registrar abono
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Total" value={formatCOP(total)} />
          <Metric label="Abonado" value={formatCOP(paid)} />
          <Metric label="Saldo" value={formatCOP(Math.max(0, total - paid))} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Palcos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {model.sales.map((sale) => (
            <article
              key={sale.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-950">Palco {sale.palco}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    sale.status === "activa"
                      ? "bg-blue-50 text-blue-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {sale.status === "activa" ? "Activo" : "Liberado"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {formatCOP(sale.paid)} de {formatCOP(sale.price)} · saldo{" "}
                {formatCOP(sale.balance)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${sale.price ? Math.min(100, (sale.paid / sale.price) * 100) : 0}%`,
                  }}
                />
              </div>
              {sale.status === "liberada" && sale.releasedAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  Liberado el {formatDate(sale.releasedAt.slice(0, 10))}
                  {sale.releaseReason ? ` · ${sale.releaseReason}` : ""}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <Receipt aria-hidden="true" size={19} />
            Pagos
          </h2>
          {model.payments.length ? (
            <div className="mt-4 space-y-3">
              {model.payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`rounded-lg border border-slate-200 p-3 text-sm ${
                    payment.cancelled ? "text-slate-500 line-through" : ""
                  }`}
                >
                  <div className="flex justify-between gap-3">
                    <strong>{formatCOP(payment.amount)}</strong>
                    <span>{formatDate(payment.date)}</span>
                  </div>
                  {payment.reference ? (
                    <p>Referencia: {payment.reference}</p>
                  ) : null}
                  {payment.note ? <p>Nota: {payment.note}</p> : null}
                  {payment.cancelled ? (
                    <p className="mt-1 text-red-700 no-underline">
                      Anulado: {payment.cancellationReason ?? "Sin motivo"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No hay pagos registrados.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Devoluciones</h2>
          {model.refunds.length ? (
            <div className="mt-4 space-y-3">
              {model.refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <strong>{formatCOP(refund.amount)}</strong>
                    <span>{formatDate(refund.date)}</span>
                  </div>
                  <p>Palco {refund.boxNumber}</p>
                  {refund.reference ? (
                    <p>Referencia: {refund.reference}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No hay devoluciones registradas.
            </p>
          )}
        </section>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-slate-950">
        {value}
      </p>
    </div>
  );
}
