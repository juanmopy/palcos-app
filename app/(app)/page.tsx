import { VenueMap } from "@/components/map/venue-map";
import type { BoxDetailData } from "@/components/box/types";
import { createClient } from "@/lib/supabase/server";

type MapPageProps = {
  searchParams: Promise<{ palco?: string }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const supabase = await createClient();
  const { data: boxes, error } = await supabase
    .from("v_palcos")
    .select("*")
    .order("numero");

  if (error) {
    throw new Error("No se pudo cargar el mapa de palcos.");
  }

  const { palco } = await searchParams;
  const selectedNumber = palco ? Number.parseInt(palco, 10) : NaN;
  const selectedBox =
    Number.isInteger(selectedNumber) && selectedNumber > 0
      ? (boxes.find((box) => box.numero === selectedNumber) ?? null)
      : null;

  let detail: BoxDetailData | null = null;
  if (selectedBox) {
    detail = {
      box: selectedBox,
      buyer: null,
      payments: [],
    };

    if (selectedBox.venta_id && selectedBox.comprador_id) {
      const [{ data: buyer }, { data: activeBoxes }] = await Promise.all([
        supabase
          .from("compradores")
          .select("nombre, apellido, documento, telefono, recomendado_por")
          .eq("id", selectedBox.comprador_id)
          .maybeSingle(),
        supabase
          .from("v_palcos")
          .select("numero")
          .eq("comprador_id", selectedBox.comprador_id)
          .not("venta_id", "is", null)
          .neq("numero", selectedBox.numero),
      ]);

      const { data: payments } = await supabase
        .from("pagos")
        .select(
          "id, monto, fecha_pago, referencia, comprobante_path, anulado, anulado_motivo, registrado_por",
        )
        .eq("comprador_id", selectedBox.comprador_id)
        .order("fecha_pago", { ascending: false });

      const paymentIds = payments?.map((payment) => payment.id) ?? [];
      const { data: applications } = paymentIds.length
        ? await supabase
            .from("pago_aplicaciones")
            .select("pago_id, monto")
            .eq("venta_id", selectedBox.venta_id)
            .in("pago_id", paymentIds)
        : { data: [] };
      const registeredByIds = [
        ...new Set((payments ?? []).map((payment) => payment.registrado_por)),
      ];
      const { data: registeredUsers } = registeredByIds.length
        ? await supabase
            .from("usuarios")
            .select("id, nombre")
            .in("id", registeredByIds)
        : { data: [] };
      const registeredBy = new Map(
        (registeredUsers ?? []).map((user) => [user.id, user.nombre]),
      );
      const applicationAmounts = new Map(
        (applications ?? []).map((application) => [
          application.pago_id,
          application.monto,
        ]),
      );

      detail = {
        box: selectedBox,
        buyer: buyer
          ? {
              name: `${buyer.nombre} ${buyer.apellido}`,
              document: buyer.documento,
              phone: buyer.telefono,
              recommendedBy: buyer.recomendado_por,
              otherBoxNumbers: (activeBoxes ?? [])
                .map((box) => box.numero)
                .filter((number): number is number => number !== null),
            }
          : null,
        payments: await Promise.all(
          (payments ?? [])
            .filter((payment) => applicationAmounts.has(payment.id))
            .map(async (payment) => {
              let receiptUrl: string | null = null;
              if (payment.comprobante_path) {
                const { data: signedUrl } = await supabase.storage
                  .from("comprobantes")
                  .createSignedUrl(payment.comprobante_path, 300);
                receiptUrl = signedUrl?.signedUrl ?? null;
              }

              return {
                id: payment.id,
                amount: applicationAmounts.get(payment.id) ?? 0,
                totalAmount: payment.monto,
                date: payment.fecha_pago,
                reference: payment.referencia,
                receiptUrl,
                registeredBy:
                  registeredBy.get(payment.registrado_por) ?? "Usuario",
                cancelled: payment.anulado,
                cancellationReason: payment.anulado_motivo,
              };
            }),
        ),
      };
    }
  }

  return <VenueMap boxes={boxes} detail={detail} />;
}
