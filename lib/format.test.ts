import { describe, expect, it } from "vitest";

import { formatCOP, formatDate, parseCOP } from "@/lib/format";

describe("formatCOP", () => {
  it("formats Colombian pesos without decimal places", () => {
    expect(formatCOP(15000000)).toBe("$ 15.000.000");
  });
});

describe("parseCOP", () => {
  it("parses formatted Colombian peso values", () => {
    expect(parseCOP("$ 15.000.000")).toBe(15000000);
  });

  it("returns zero for an empty value", () => {
    expect(parseCOP("")).toBe(0);
  });
});

describe("formatDate", () => {
  it("formats dates in Colombian Spanish and Bogota time", () => {
    expect(formatDate("2026-11-08T03:30:00.000Z")).toBe("7 nov 2026");
  });
});
