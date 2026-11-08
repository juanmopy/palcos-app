"use client";

import {
  ArrowLeft,
  CalendarDays,
  FileImage,
  Landmark,
  Pencil,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BuyerEditForm } from "@/components/forms/buyer-edit-form";
import { CancelPaymentDialog } from "@/components/forms/cancel-payment-dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { ReleaseDialog } from "@/components/forms/release-dialog";
import { ReserveForm } from "@/components/forms/reserve-form";
import { Button } from "@/components/ui/button";
import { formatCOP, formatDate } from "@/lib/format";
import type { BoxDetailData } from "@/components/box/types";
import type { BoxStatus } from "@/components/map/types";

import { ProgressBar } from "./progress-bar";
import { StatusBadge } from "./status-badge";

type BoxDetailProps = {
  detail: BoxDetailData;
};

export function BoxDetail({ detail }: BoxDetailProps) {
  const router = useRouter();
  const { box, buyer, payments } = detail;
  const [mode, setMode] = useState<"detail" | "reserve" | "payment" | "edit">(
    "detail",
  );
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState<string | null>(null);
  const status = (box.estado ?? "disponible") as BoxStatus;
  const price = box.precio ?? 0;
  const paid = box.abonado ?? 0;
  const percentage = box.porcentaje ?? 0;

  function close() {
    router.push("/", { scroll: false });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="box-detail-title"
    >
      <button
        type="button"
        aria-label="Cerrar detalle del palco"
        className="absolute inset-0 cursor-default"
        onClick={close}
      />
      <aside className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:h-full sm:max-h-none sm:w-[min(100%,28rem)] sm:rounded-none sm:border-l sm:border-slate-200 sm:p-6">
        {mode === "reserve" ? (
          <ReserveForm
            palco={box.numero ?? 0}
            categoryName={box.categoria_nombre ?? ""}
            price={price}
            buyers={detail.reserveBuyers}
            recommendations={detail.recommendations}
            onCancel={() => setMode("detail")}
            onSuccess={() => router.refresh()}
          />
        ) : mode === "payment" && buyer ? (
          <PaymentForm
            buyerId={buyer.id}
            sales={detail.activeSales}
            initialSaleId={box.venta_id ?? ""}
            onCancel={() => setMode("detail")}
            onSuccess={() => router.refresh()}
          />
        ) : mode === "edit" && buyer ? (
          <BuyerEditForm
            buyer={buyer}
            onCancel={() => setMode("detail")}
            onSuccess={() => {
              setMode("detail");
              router.refresh();
            }}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
                  Detalle del palco
                </p>
                <h2
                  id="box-detail-title"
                  className="mt-1 text-2xl font-bold text-slate-950"
                >
                  Palco {box.numero} · {box.categoria_nombre} ·{" "}
                  {formatCOP(price)}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                aria-label="Cerrar detalle"
              >
                <X aria-hidden="true" size={22} />
              </button>
            </div>

            <div className="mt-5">
              <StatusBadge status={status} />
            </div>

            {status === "disponible" ? (
              <div className="mt-8 space-y-5">
                <p className="text-slate-600">
                  Este palco está disponible para separar.
                </p>
                <Button
                  type="button"
                  className="min-h-12 w-full"
                  onClick={() => setMode("reserve")}
                >
                  Separar palco
                </Button>
              </div>
            ) : (
              <div className="mt-7 space-y-7">
                <section aria-labelledby="payment-progress-title">
                  <h3
                    id="payment-progress-title"
                    className="mb-3 text-sm font-semibold text-slate-900"
                  >
                    Estado del pago
                  </h3>
                  <ProgressBar
                    value={percentage}
                    label={`${formatCOP(paid)} de ${formatCOP(price)} (${percentage}%)`}
                  />
                  <p className="mt-2 text-sm text-slate-600">
                    Saldo pendiente:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatCOP(box.saldo)}
                    </span>
                  </p>
                </section>

                {buyer ? (
                  <section
                    className="space-y-3 border-t border-slate-200 pt-6"
                    aria-labelledby="buyer-title"
                  >
                    <h3
                      id="buyer-title"
                      className="text-sm font-semibold text-slate-900"
                    >
                      Comprador
                    </h3>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="flex items-center gap-2 font-semibold text-slate-950">
                        <UserRound aria-hidden="true" size={17} />
                        {buyer.name}
                      </p>
                      <p>Documento: {buyer.document}</p>
                      <a
                        className="inline-flex items-center gap-2 text-blue-800 underline"
                        href={`tel:${buyer.phone}`}
                      >
                        <Phone aria-hidden="true" size={16} />
                        {buyer.phone}
                      </a>
                      {buyer.recommendedBy ? (
                        <p>Recomendado por: {buyer.recommendedBy}</p>
                      ) : null}
                      {buyer.otherBoxNumbers.length > 0 ? (
                        <p>
                          También tiene:{" "}
                          {buyer.otherBoxNumbers
                            .sort((a, b) => a - b)
                            .join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section
                  className="border-t border-slate-200 pt-6"
                  aria-labelledby="payment-history-title"
                >
                  <h3
                    id="payment-history-title"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Historial de abonos
                  </h3>
                  {payments.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">
                      Aún no hay abonos registrados.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {payments.map((payment) => (
                        <article
                          key={payment.id}
                          className={`rounded-lg border border-slate-200 p-3 ${
                            payment.cancelled ? "text-slate-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={
                                payment.cancelled ? "line-through" : ""
                              }
                            >
                              <p className="font-semibold">
                                {formatCOP(payment.amount)}
                              </p>
                              {payment.totalAmount !== payment.amount ? (
                                <p className="text-xs">
                                  de una transferencia de{" "}
                                  {formatCOP(payment.totalAmount)}
                                </p>
                              ) : null}
                            </div>
                            <p className="flex items-center gap-1 text-xs">
                              <CalendarDays aria-hidden="true" size={14} />
                              {formatDate(payment.date)}
                            </p>
                          </div>
                          {payment.reference ? (
                            <p className="mt-2 text-xs">
                              Referencia: {payment.reference}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs">
                            Registró: {payment.registeredBy}
                          </p>
                          {payment.cancelled ? (
                            <p className="mt-2 text-xs font-semibold text-red-700">
                              Anulado:{" "}
                              {payment.cancellationReason ?? "Sin motivo"}
                            </p>
                          ) : null}
                          {payment.receiptUrl ? (
                            <a
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-800"
                            >
                              <FileImage aria-hidden="true" size={16} />
                              Ver comprobante
                            </a>
                          ) : null}
                          {!payment.cancelled ? (
                            <button
                              type="button"
                              onClick={() => setCancelPaymentId(payment.id)}
                              className="mt-3 block min-h-11 text-sm font-semibold text-red-700 underline focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:outline-none"
                            >
                              Anular abono
                            </button>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <div className="space-y-3 border-t border-slate-200 pt-6">
                  <Button
                    type="button"
                    className="min-h-12 w-full"
                    disabled={status === "pagado"}
                    onClick={() => setMode("payment")}
                    title={
                      status === "pagado"
                        ? "El palco ya está pagado"
                        : "Disponible en el siguiente paso"
                    }
                  >
                    <Landmark aria-hidden="true" size={18} />
                    Registrar abono
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full"
                    onClick={() => setMode("edit")}
                  >
                    <Pencil aria-hidden="true" size={17} />
                    Editar comprador
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-4 min-h-11 w-full"
                    onClick={() => setReleaseOpen(true)}
                  >
                    <ArrowLeft aria-hidden="true" size={17} />
                    Liberar palco
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {releaseOpen && buyer && box.venta_id ? (
          <ReleaseDialog
            open={releaseOpen}
            boxNumber={box.numero ?? 0}
            saleId={box.venta_id}
            refundAmount={box.abonado ?? 0}
            buyerName={buyer.name}
            onClose={() => setReleaseOpen(false)}
            onSuccess={() => {
              setReleaseOpen(false);
              router.refresh();
            }}
          />
        ) : null}
        {cancelPaymentId ? (
          <CancelPaymentDialog
            paymentId={cancelPaymentId}
            onClose={() => setCancelPaymentId(null)}
            onSuccess={() => {
              setCancelPaymentId(null);
              router.refresh();
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}
