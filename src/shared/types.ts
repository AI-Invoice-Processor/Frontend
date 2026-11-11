export type ProcessingStatus =
  "recibida" | "procesando" | "extraida" | "validada" | "error";
export type ReviewStatus = "sin-revision" | "requiere-revision" | "revisada";
export type FindingSeverity = "info" | "warning" | "critical";
export type MatchStatus =
  "encontrado" | "incierto" | "no-encontrado" | "no-disponible";
export interface Supplier {
  id: string;
  name: string;
  nit: string;
}
export interface InvoiceLine {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}
export interface DocumentReference {
  id: string;
  type: "contrato" | "orden-compra" | "soporte";
  reference: string;
  name: string;
  status: MatchStatus;
  evidence?: string;
}
export interface ExtractedField<T = string> {
  key: string;
  label: string;
  value?: T;
  source: string;
  confidence?: number;
  verification:
    "verificado" | "pendiente" | "desconocido" | "faltante" | "con-diferencia";
  evidence?: string;
}
export interface ExtractionResult {
  status: "completa" | "parcial" | "error";
  fields: ExtractedField[];
  lines: InvoiceLine[];
  missingFields: string[];
  uncertainFields: string[];
}
export interface DocumentMatch {
  document: DocumentReference;
  explanation: string;
}
export interface ValidationEvidence {
  label: string;
  reference: string;
  detail: string;
}
export interface ValidationFinding {
  id: string;
  code: string;
  title: string;
  result: string;
  description: string;
  severity: FindingSeverity;
  evidence: ValidationEvidence[];
  comparison?: {
    leftLabel: string;
    leftValue: string;
    rightLabel: string;
    rightValue: string;
    difference?: string;
  };
  requiresReview: boolean;
}
export interface CausationProposal {
  supplier: Supplier;
  invoiceNumber: string;
  subtotal?: string;
  tax?: string;
  total: string;
  account?: string;
  costCenter?: string;
  status: "propuesta" | "requiere-revision" | "no-disponible";
  exceptions: string[];
  disclaimer: string;
}
export interface HumanReview {
  required: boolean;
  reason?: string;
  status: "pendiente" | "en-revision" | "completada";
  history?: HumanReviewEvent[];
}
export type HumanReviewAction =
  | "solicitar-revision"
  | "registrar-observacion"
  | "verificar-duplicado"
  | "solicitar-soporte"
  | "corregir-extraccion";
export interface HumanReviewEvent {
  id: string;
  action: HumanReviewAction;
  observation: string;
  status: "simulada";
  createdAt: string;
}
export interface Invoice {
  id: string;
  supplier: Supplier;
  invoiceNumber: string;
  date: string;
  total: string;
  currency: "COP";
  fileName: string;
  fileType: "pdf" | "image";
  scenario: "normal" | "difference" | "duplicate" | "missing-support";
  processingStatus: ProcessingStatus;
  reviewStatus: ReviewStatus;
  extraction: ExtractionResult;
  relatedDocuments: DocumentMatch[];
  validations: ValidationFinding[];
  causation: CausationProposal;
  humanReview: HumanReview;
}
export interface ApiError {
  code: string;
  message: string;
  details?: string;
}
