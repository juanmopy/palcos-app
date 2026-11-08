import { Users } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";

export default function BuyersPage() {
  return (
    <EmptyState
      icon={Users}
      title="Compradores"
      description="Aquí aparecerán los compradores y sus palcos asignados."
    />
  );
}
