import type { Invoice, ValidationFinding } from "../../shared/types";

export function getPrimaryFinding(
  invoice: Invoice,
): ValidationFinding | undefined {
  return (
    invoice.validations.find((finding) => finding.requiresReview) ??
    invoice.validations[0]
  );
}

export function getNextAction(invoice: Invoice): string {
  if (invoice.scenario === "difference") return "Revisar diferencia";
  if (invoice.scenario === "duplicate") return "Ver duplicado";
  if (invoice.scenario === "missing-support") return "Completar soporte";
  return "Ver análisis";
}
