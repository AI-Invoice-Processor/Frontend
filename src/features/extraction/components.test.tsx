// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { ConfidenceIndicator, VerificationStatus } from "./components";

describe("extraction confidence indicators", () => {
  afterEach(cleanup);

  it.each([
    [0.99, "99%", "Alta confianza"],
    [0.84, "84%", "Confianza media"],
    [0.76, "76%", "Revisar extracción"],
  ])("interprets %s independently", (value, percent, label) => {
    render(
      <ConfidenceIndicator confidence={value} source="Factura · pág. 1" />,
    );
    expect(screen.getByText(percent)).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("Factura · pág. 1")).toBeInTheDocument();
  });

  it("keeps documentary verification separate from extraction confidence", () => {
    render(
      <>
        <ConfidenceIndicator
          confidence={0.76}
          source="Factura · pág. 1"
          compact
        />
        <VerificationStatus status="verificado" />
      </>,
    );
    expect(screen.getByText("Revisar extracción")).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
  });
});
