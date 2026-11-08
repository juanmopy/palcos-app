const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

export function formatCOP(value: number | null | undefined) {
  return COP_FORMATTER.format(value ?? 0).replace(/\u00a0/g, " ");
}

export function parseCOP(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function formatDate(value: string | Date) {
  return DATE_FORMATTER.format(
    typeof value === "string" ? new Date(value) : value,
  ).replace(/\sde\s/g, " ");
}
