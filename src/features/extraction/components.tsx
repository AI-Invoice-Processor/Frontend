import type { CSSProperties, ReactNode } from "react";
import { CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";
import { Badge } from "../../components/ui";
import type { ExtractedField } from "../../shared/types";

type ConfidenceLevel = "high" | "medium" | "low";

function getConfidenceLevel(percent: number): ConfidenceLevel {
  if (percent >= 95) return "high";
  if (percent >= 80) return "medium";
  return "low";
}

const confidenceLabels: Record<ConfidenceLevel, string> = {
  high: "Alta confianza",
  medium: "Confianza media",
  low: "Revisar extracción",
};

export function ConfidenceIndicator({
  confidence,
  source,
  compact = false,
}: {
  confidence?: number;
  source: string;
  compact?: boolean;
}) {
  if (confidence == null) {
    return (
      <div
        className={`confidence confidence-missing ${compact ? "compact" : ""}`}
      >
        <div className="confidence-ring" aria-hidden="true">
          <HelpCircle size={15} />
        </div>
        <div className="confidence-copy">
          <strong>Sin confianza disponible</strong>
          <span>{source}</span>
        </div>
      </div>
    );
  }
  const percent = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const level = getConfidenceLevel(percent);
  const style = {
    "--confidence-angle": `${percent * 3.6}deg`,
  } as CSSProperties;
  return (
    <div
      className={`confidence confidence-${level} ${compact ? "compact" : ""}`}
      title={`${percent}% de confianza de extracción. ${confidenceLabels[level]}.`}
    >
      <div
        className="confidence-ring"
        style={style}
        role="img"
        aria-label={`${percent}% de confianza de extracción: ${confidenceLabels[level]}`}
      >
        <span>{percent}%</span>
      </div>
      <div className="confidence-copy">
        <strong>{confidenceLabels[level]}</strong>
        <span>{source}</span>
      </div>
    </div>
  );
}

const verificationConfig = {
  verificado: {
    label: "Verificado",
    tone: "success" as const,
    icon: CheckCircle2,
  },
  pendiente: { label: "Pendiente", tone: "warning" as const, icon: HelpCircle },
  "con-diferencia": {
    label: "Con diferencia",
    tone: "danger" as const,
    icon: ShieldAlert,
  },
  desconocido: {
    label: "Requiere revisión",
    tone: "warning" as const,
    icon: HelpCircle,
  },
  faltante: {
    label: "Requiere revisión",
    tone: "warning" as const,
    icon: HelpCircle,
  },
};

export function VerificationStatus({
  status,
  children,
}: {
  status: ExtractedField["verification"];
  children?: ReactNode;
}) {
  const config = verificationConfig[status];
  const Icon = config.icon;
  return (
    <span className="verification-status">
      <Badge tone={config.tone}>
        <Icon size={13} aria-hidden="true" /> {config.label}
      </Badge>
      {children}
    </span>
  );
}
