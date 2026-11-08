import { notFound } from "next/navigation";

import {
  BuyerDetail,
  type BuyerDetailModel,
} from "@/components/buyers/buyer-detail";
import { createClient } from "@/lib/supabase/server";

type BuyerPageProps = { params: Promise<{ id: string }> };

export default async function BuyerPage({ params }: BuyerPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: buyer, error }, { data: sales, error: salesError }] =
    await Promise.all([
      supabase.from("compradores").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("ventas")
        .select(
          "id, palco_numero, estado, separado_en, liberado_en, motivo_liberacion",
        )
        .eq("comprador_id", id)
        .order("separado_en", { ascending: false }),
    ]);
  if (error || salesError) throw new Error("No se pudo cargar el comprador.");
  if (!buyer) notFound();

  const saleRows = sales ?? [];
  const boxNumbers = saleRows.map((sale) => sale.palco_numero);
  const [
    { data: boxes, error: boxError },
    { data: payments, error: paymentError },
  ] = await Promise.all([
    supabase
      .from("palcos")
      .select("numero, categoria_id")
      .in("numero", boxNumbers),
    supabase
      .from("pagos")
      .select(
        "id, monto, fecha_pago, referencia, nota, anulado, anulado_motivo",
      )
      .eq("comprador_id", id)
      .order("fecha_pago", { ascending: false }),
  ]);
  if (boxError || paymentError) {
    throw new Error("No se pudo cargar el detalle financiero.");
  }

  const categoryIds = [
    ...new Set((boxes ?? []).map((box) => box.categoria_id)),
  ];
  const { data: categories, error: categoryError } = await supabase
    .from("categorias")
    .select("id, precio")
    .in("id", categoryIds);
  if (categoryError) {
    throw new Error("No se pudieron cargar los precios de los palcos.");
  }
  const prices = new Map(
    (categories ?? []).map((category) => [category.id, category.precio]),
  );
  const categoryByBox = new Map(
    (boxes ?? []).map((box) => [box.numero, box.categoria_id]),
  );
  const paymentIds = (payments ?? []).map((payment) => payment.id);
  const { data: applications, error: applicationError } = paymentIds.length
    ? await supabase
        .from("pago_aplicaciones")
        .select("pago_id, venta_id, monto")
        .in("pago_id", paymentIds)
    : { data: [], error: null };
  if (applicationError) {
    throw new Error("No se pudieron cargar las aplicaciones de pago.");
  }

  const paidBySale = new Map<string, number>();
  for (const application of applications ?? []) {
    const payment = (payments ?? []).find(
      (item) => item.id === application.pago_id,
    );
    if (payment && !payment.anulado) {
      paidBySale.set(
        application.venta_id,
        (paidBySale.get(application.venta_id) ?? 0) + application.monto,
      );
    }
  }
  const modelSales = saleRows.map((sale) => {
    const price = prices.get(categoryByBox.get(sale.palco_numero) ?? "") ?? 0;
    const paid = paidBySale.get(sale.id) ?? 0;
    return {
      id: sale.id,
      palco: sale.palco_numero,
      status: sale.estado as "activa" | "liberada",
      price,
      paid,
      balance: Math.max(0, price - paid),
      separatedAt: sale.separado_en,
      releasedAt: sale.liberado_en,
      releaseReason: sale.motivo_liberacion,
    };
  });
  const activeSales = modelSales
    .filter((sale) => sale.status === "activa" && sale.balance > 0)
    .map((sale) => ({
      venta_id: sale.id,
      palco_numero: sale.palco,
      saldo: sale.balance,
      paid: sale.paid,
      price: sale.price,
    }));

  const { data: refunds, error: refundError } = await supabase
    .from("devoluciones")
    .select("id, monto, fecha_devolucion, referencia, venta_id")
    .in(
      "venta_id",
      saleRows.map((sale) => sale.id),
    );
  if (refundError) throw new Error("No se pudieron cargar las devoluciones.");
  const boxBySale = new Map(
    saleRows.map((sale) => [sale.id, sale.palco_numero]),
  );

  const detail: BuyerDetailModel = {
    buyer: {
      id: buyer.id,
      firstName: buyer.nombre,
      lastName: buyer.apellido,
      name: `${buyer.nombre} ${buyer.apellido}`,
      document: buyer.documento,
      phone: buyer.telefono,
      recommendedBy: buyer.recomendado_por,
    },
    sales: modelSales,
    payments: (payments ?? []).map((payment) => ({
      id: payment.id,
      amount: payment.monto,
      date: payment.fecha_pago,
      reference: payment.referencia,
      note: payment.nota,
      cancelled: payment.anulado,
      cancellationReason: payment.anulado_motivo,
    })),
    refunds: (refunds ?? []).map((refund) => ({
      id: refund.id,
      amount: refund.monto,
      date: refund.fecha_devolucion,
      reference: refund.referencia,
      boxNumber: boxBySale.get(refund.venta_id) ?? 0,
    })),
    activeSales,
  };

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
        Comprador
      </p>
      <BuyerDetail model={detail} />
    </div>
  );
}
