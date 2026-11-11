import { describe, expect, it } from "vitest";
import { invoiceFixtures } from "../../mocks/fixtures";
import { getNextAction, getPrimaryFinding } from "./logic";

describe("invoice review prioritization", () => {
  it.each([
    ["difference", "Revisar diferencia"],
    ["duplicate", "Ver duplicado"],
    ["missing-support", "Completar soporte"],
    ["normal", "Ver análisis"],
  ])("maps %s to the right next action", (scenario, expected) => {
    const invoice = invoiceFixtures.find((item) => item.scenario === scenario);
    expect(invoice).toBeDefined();
    expect(getNextAction(invoice!)).toBe(expected);
  });

  it("prioritizes a review finding over informational findings", () => {
    const invoice = invoiceFixtures.find(
      (item) => item.scenario === "difference",
    );
    expect(getPrimaryFinding(invoice!)?.code).toBe("VAL-001");
  });
});
