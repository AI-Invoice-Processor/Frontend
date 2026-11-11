import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "../../components/ui";
import type { Invoice } from "../../shared/types";
import { getPrimaryFinding } from "./logic";

export function ExceptionSummary({ invoice }: { invoice: Invoice }) {
  const finding = getPrimaryFinding(invoice);
  const hasException =
    finding &&
    (invoice.reviewStatus === "requiere-revision" ||
      invoice.validations.some((item) => item.requiresReview));
  if (!hasException) {
    return (
      <section
        className="exception-summary exception-summary-ok"
        aria-label="Resumen de validación"
      >
        <div className="exception-summary-icon">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <strong>Sin diferencias detectadas</strong>
          <span>Revisión humana pendiente.</span>
        </div>
        <Badge tone="success">Sin hallazgos</Badge>
      </section>
    );
  }
  const comparison = finding.comparison;
  return (
    <section
      className={`exception-summary exception-summary-${finding.severity}`}
      aria-label="Resumen de excepción"
    >
      <div className="exception-summary-top">
        <div className="exception-summary-icon">
          <AlertTriangle size={18} />
        </div>
        <div>
          <strong>
            {finding.code === "VAL-001"
              ? "Diferencia con la OC"
              : finding.title}
          </strong>
          <span>Requiere revisión</span>
        </div>
        <Badge tone="warning">
          {invoice.reviewStatus === "revisada"
            ? "Revisión registrada"
            : "Revisión requerida"}
        </Badge>
      </div>
      {comparison ? (
        <div className="exception-comparison">
          <div>
            <span>Factura</span>
            <strong>{comparison.leftValue}</strong>
          </div>
          <div className="comparison-operator">vs.</div>
          <div>
            <span>Orden de compra</span>
            <strong>{comparison.rightValue}</strong>
          </div>
          <div className="exception-difference">
            <span>Diferencia observada</span>
            <strong>{comparison.difference}</strong>
          </div>
        </div>
      ) : (
        <div className="exception-detail">
          <ShieldAlert size={16} />
          <span>{finding.result}.</span>
        </div>
      )}
      <div className="exception-summary-foot">
        <span>
          <FileText size={14} /> Evidencia: {finding.code}
        </span>
        <span>
          <UserRoundCheck size={14} /> Revisión humana
        </span>
      </div>
      <details className="exception-details">
        <summary>Ver explicación</summary>
        <p>{finding.description}</p>
      </details>
    </section>
  );
}

export function StepRail({ active = 0 }: { active: number }) {
  const steps = [
    "Información encontrada",
    "Validaciones",
    "Propuesta contable",
    "Decisión humana",
  ];
  return (
    <ol className="step-rail" aria-label="Etapas del caso">
      {steps.map((step, index) => (
        <li
          className={
            index === active ? "active" : index < active ? "complete" : ""
          }
          key={step}
        >
          <span>{index < active ? <CheckCircle2 size={14} /> : index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}

export function ReviewCallout({ invoice }: { invoice: Invoice }) {
  const finding = getPrimaryFinding(invoice);
  return (
    <div className="review-callout">
      <div className="review-callout-icon">
        <Search size={18} />
      </div>
      <div>
        <strong>{finding?.title ?? "Revisión humana recomendada"}</strong>
        <span>
          {finding?.description ??
            "Una persona responsable debe revisar la propuesta antes de registrarla."}
        </span>
      </div>
    </div>
  );
}

export function ProcessingTimeline({ active = 0 }: { active?: number }) {
  const steps = [
    "Archivo recibido",
    "Procesamiento simulado",
    "Análisis disponible",
  ];
  return (
    <ol className="processing-timeline" aria-label="Estado de procesamiento">
      {steps.map((step, index) => (
        <li className={index <= active ? "active" : ""} key={step}>
          <span>{index < active ? <CheckCircle2 size={13} /> : index + 1}</span>
          <div>
            <strong>{step}</strong>
            <small>
              {index === 0
                ? "Validación local completada"
                : index === 1
                  ? "OCR y relaciones representadas con mocks"
                  : "Listo para revisar"}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
