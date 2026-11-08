import type { Tables } from "@/lib/database.types";

export type VenueBox = Tables<"v_palcos">;

export type BoxStatus = "disponible" | "separado" | "pagado";
export type BoxSide = "izquierdo" | "derecho";
export type BoxCategory = "azul" | "amarillo" | "rojo" | "verde";
