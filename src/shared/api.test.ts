import { describe, expect, it } from "vitest";
import { invoiceApi } from "./api";
import { applyReviewState } from "./review";

describe("invoiceApi mock adapter", () => {
  it("returns the four deterministic scenarios", async () => {
    const invoices = await invoiceApi.list();
    expect(invoices).toHaveLength(4);
    expect(invoices.map((invoice) => invoice.scenario)).toEqual([
      "normal",
      "difference",
      "duplicate",
      "missing-support",
    ]);
  });

  it("preserves the official difference scenario as strings", async () => {
    const invoice = await invoiceApi.get("INV-002");
    expect(invoice.total).toBe("52000000");
    expect(invoice.validations[0].comparison?.difference).toBe("$2.000.000");
    expect(invoice.causation.status).toBe("requiere-revision");
  });

  it("supports empty and simulated error states", async () => {
    expect(await invoiceApi.list({ query: "no existe" })).toEqual([]);
    await expect(invoiceApi.list({ query: "error" })).rejects.toMatchObject({
      code: "MOCK_QUERY_ERROR",
    });
  });

  it("hydrates a simulated review without changing financial findings", async () => {
    const invoice = await invoiceApi.get("INV-002");
    const reviewed = applyReviewState(invoice, [
      {
        id: "review-test",
        action: "solicitar-revision",
        observation: "Validar la diferencia con la orden de compra.",
        status: "simulada",
        createdAt: "2026-11-10T10:00:00.000Z",
      },
    ]);
    expect(reviewed.reviewStatus).toBe("revisada");
    expect(reviewed.humanReview.history).toHaveLength(1);
    expect(reviewed.total).toBe(invoice.total);
    expect(reviewed.validations[0].comparison?.difference).toBe("$2.000.000");
  });
});
