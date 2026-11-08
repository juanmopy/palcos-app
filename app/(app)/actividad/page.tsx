import { Activity } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";

export default function ActivityPage() {
  return (
    <EmptyState
      icon={Activity}
      title="Actividad"
      description="Aquí aparecerá la bitácora de acciones del equipo."
    />
  );
}
