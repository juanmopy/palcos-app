import type { LucideIcon } from "lucide-react";
import { Activity, ChartNoAxesColumn, Map, Users } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Mapa", icon: Map },
  { href: "/compradores", label: "Compradores", icon: Users },
  { href: "/resumen", label: "Resumen", icon: ChartNoAxesColumn },
  { href: "/actividad", label: "Actividad", icon: Activity },
];
