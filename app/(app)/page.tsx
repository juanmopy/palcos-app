import { VenueMap } from "@/components/map/venue-map";
import { createClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: boxes, error } = await supabase
    .from("v_palcos")
    .select("*")
    .order("numero");

  if (error) {
    throw new Error("No se pudo cargar el mapa de palcos.");
  }

  return <VenueMap boxes={boxes} />;
}
