import { ChartNoAxesColumn } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";

export default function SummaryPage() {
  return (
    <EmptyState
      icon={ChartNoAxesColumn}
      title="Resumen"
      description="Aquí verás los indicadores de ventas, recaudo y saldos."
    />
  );
}
