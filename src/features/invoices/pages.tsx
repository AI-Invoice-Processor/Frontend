import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ChevronRight,
  FileCheck2,
  FileUp,
  FileText,
  Filter,
  Info,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Menu,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  XCircle,
} from "lucide-react";
import { Badge, Button } from "../../components/ui";
import { validateInvoiceFile } from "../document-upload/validation";
import {
  ConfidenceIndicator,
  VerificationStatus,
} from "../extraction/components";
import { invoiceApi, isDemoMode } from "../../shared/api";
import {
  ExceptionSummary,
  ProcessingTimeline,
  ReviewCallout,
  StepRail,
} from "./components";
import { getNextAction, getPrimaryFinding } from "./logic";
import type { Invoice, ValidationFinding } from "../../shared/types";
import type { HumanReviewAction, HumanReviewEvent } from "../../shared/types";
import { reviewApi } from "../../shared/review";
import { formatCop, formatDate } from "../../shared/utils";

const statusLabel: Record<string, string> = {
  "sin-revision": "Sin revisión",
  "requiere-revision": "Requiere revisión",
  revisada: "Revisada",
  validada: "Validada",
  extraida: "Extraída",
  procesando: "Procesando",
  recibida: "Recibida",
  error: "Error",
};
const toneFor = (
  value: string,
): "neutral" | "success" | "warning" | "danger" | "info" =>
  value === "requiere-revision" || value === "warning"
    ? "warning"
    : value === "validada" || value === "revisada"
      ? "success"
      : value === "critical"
        ? "danger"
        : "info";

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <strong>AI Invoice</strong>
            <span>Processor</span>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          <Link
            to="/facturas"
            activeProps={{ className: "nav-item active" }}
            className="nav-item"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard size={18} /> Bandeja de facturas
          </Link>
          <Link
            to="/facturas/nueva"
            activeProps={{ className: "nav-item active" }}
            className="nav-item"
            onClick={() => setOpen(false)}
          >
            <FileUp size={18} /> Cargar documento
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="demo-note">
            <span className="status-dot" /> Modo demostración
            <br />
            <small>Datos sintéticos</small>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label="Cambiar tema"
            aria-pressed={dark}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}{" "}
            {dark ? "Tema claro" : "Tema oscuro"}
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="mobile-overlay"
          onClick={() => setOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Abrir navegación"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            Operaciones <ChevronRight size={14} /> Facturas
          </div>
          <div className="topbar-actions">
            <span className="environment-chip">
              <span className="status-dot" />{" "}
              {isDemoMode ? "Simulación" : "API conectada"}
            </span>
            <div className="avatar">AF</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow ?? "AI INVOICE PROCESSOR"}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function StatePanel({
  kind,
  title,
  message,
}: {
  kind: "loading" | "empty" | "error";
  title: string;
  message: string;
}) {
  return (
    <div className={`state-panel ${kind}`}>
      <div className="state-icon">
        {kind === "loading" ? (
          <Loader2 className="spin" />
        ) : kind === "error" ? (
          <XCircle />
        ) : (
          <FileText />
        )}
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {kind === "error" && (
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      )}
    </div>
  );
}
export function InvoicesPage() {
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("invoice-inbox-query") ?? ""),
  );
  const [review, setReview] = useState(
    () =>
      (typeof window === "undefined"
        ? "todos"
        : sessionStorage.getItem("invoice-inbox-review")) ?? "todos",
  );
  useEffect(() => {
    sessionStorage.setItem("invoice-inbox-query", query);
    sessionStorage.setItem("invoice-inbox-review", review);
  }, [query, review]);
  const invoicesQuery = useQuery({
    queryKey: ["invoices", query, review],
    queryFn: () => invoiceApi.list({ query, reviewStatus: review }),
  });
  const invoices = [...(invoicesQuery.data ?? [])].sort(
    (a, b) =>
      Number(b.reviewStatus === "requiere-revision") -
      Number(a.reviewStatus === "requiere-revision"),
  );
  const table = useReactTable({
    data: invoices,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
  });
  const state = invoicesQuery.isPending
    ? "loading"
    : invoicesQuery.isError
      ? "error"
      : invoices.length
        ? "ready"
        : "empty";
  return (
    <>
      <PageHeader
        title="Bandeja de facturas"
        description="Prioriza excepciones y revisa cada caso antes de proponer causación."
        action={
          <Link to="/facturas/nueva" className="button button-primary">
            <FileUp size={17} /> Cargar factura
          </Link>
        }
      />
      <div className="inbox-priority-heading">
        <div>
          <strong>Excepciones prioritarias</strong>
          <span>Ordenadas primero para facilitar el triage financiero.</span>
        </div>
        <span className="priority-legend">
          <AlertTriangle size={14} /> Requiere revisión
        </span>
      </div>
      {isDemoMode && (
        <div className="notice demo-banner">
          <Info size={18} />
          <div>
            <strong>Estás viendo datos sintéticos</strong>
            <span>
              Las extracciones, relaciones y validaciones son simuladas para la
              demostración.
            </span>
          </div>
        </div>
      )}
      <div className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">Buscar facturas</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por proveedor, NIT o número"
          />
        </label>
        <label className="select-field">
          <Filter size={16} />
          <span className="sr-only">Filtrar revisión</span>
          <select value={review} onChange={(e) => setReview(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="sin-revision">Sin revisión</option>
            <option value="requiere-revision">Requiere revisión</option>
          </select>
        </label>
        <Button
          className="quick-filter"
          variant={review === "requiere-revision" ? "primary" : "secondary"}
          onClick={() =>
            setReview(
              review === "requiere-revision" ? "todos" : "requiere-revision",
            )
          }
        >
          <AlertTriangle size={15} /> Requieren revisión
        </Button>
      </div>
      {state === "loading" && (
        <StatePanel
          kind="loading"
          title="Consultando bandeja"
          message="Cargando facturas del conjunto de demostración…"
        />
      )}
      {state === "empty" && (
        <StatePanel
          kind="empty"
          title="No hay facturas"
          message="Ajusta la búsqueda o carga un nuevo documento para comenzar."
        />
      )}
      {state === "error" && (
        <StatePanel
          kind="error"
          title="No pudimos consultar las facturas"
          message="El error fue simulado para representar un fallo de conexión con la API."
        />
      )}
      {state === "ready" && (
        <div className="table-card">
          <div className="table-wrap desktop-invoice-table">
            <table>
              <caption className="sr-only">Facturas disponibles</caption>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Motivo principal</th>
                  <th>Procesamiento</th>
                  <th>Revisión</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const invoice = row.original;
                  return (
                    <tr key={invoice.id}>
                      <td>
                        <Link
                          className="invoice-link"
                          to="/facturas/$invoiceId/analisis"
                          params={{ invoiceId: invoice.id }}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <span className="subtext">{invoice.fileName}</span>
                      </td>
                      <td>
                        <strong>{invoice.supplier.name}</strong>
                        <span className="subtext">
                          NIT {invoice.supplier.nit}
                        </span>
                      </td>
                      <td>{formatDate(invoice.date)}</td>
                      <td className="money">{formatCop(invoice.total)}</td>
                      <td>
                        <span
                          className={`reason-pill ${invoice.reviewStatus === "requiere-revision" ? "has-exception" : ""}`}
                        >
                          {getPrimaryFinding(invoice)?.title ??
                            "Sin diferencias"}
                        </span>
                      </td>
                      <td>
                        <Badge tone={toneFor(invoice.processingStatus)}>
                          {statusLabel[invoice.processingStatus]}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={toneFor(invoice.reviewStatus)}>
                          {statusLabel[invoice.reviewStatus]}
                        </Badge>
                      </td>
                      <td>
                        <Link
                          className="table-action-link"
                          aria-label={`${getNextAction(invoice)} para ${invoice.invoiceNumber}`}
                          to="/facturas/$invoiceId/analisis"
                          params={{ invoiceId: invoice.id }}
                        >
                          {getNextAction(invoice)} <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="invoice-mobile-list">
            {invoices.map((invoice) => (
              <article
                className={`invoice-mobile-card ${invoice.reviewStatus === "requiere-revision" ? "needs-review" : ""}`}
                key={invoice.id}
              >
                <div className="invoice-mobile-top">
                  <div>
                    <Link
                      className="invoice-link"
                      to="/facturas/$invoiceId/analisis"
                      params={{ invoiceId: invoice.id }}
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <span className="subtext">{invoice.supplier.name}</span>
                  </div>
                  <strong className="money">{formatCop(invoice.total)}</strong>
                </div>
                <div className="invoice-mobile-reason">
                  <span>Motivo principal</span>
                  <strong>
                    {getPrimaryFinding(invoice)?.title ?? "Sin diferencias"}
                  </strong>
                </div>
                <div className="invoice-mobile-foot">
                  <Badge tone={toneFor(invoice.reviewStatus)}>
                    {statusLabel[invoice.reviewStatus]}
                  </Badge>
                  <Link
                    className="next-action-link"
                    to="/facturas/$invoiceId/analisis"
                    params={{ invoiceId: invoice.id }}
                  >
                    {getNextAction(invoice)} <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="table-footer">
            <span>
              {invoices.length} facturas en el conjunto de demostración
            </span>
            <span>Última actualización: ahora</span>
          </div>
        </div>
      )}
    </>
  );
}
export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const onFile = (candidate?: File) => {
    if (!candidate) return;
    const validationError = validateInvoiceFile(candidate);
    if (validationError) return setError(validationError);
    setError("");
    setFile(candidate);
  };
  const submit = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const invoice = await invoiceApi.upload(file);
      navigate({
        to: "/facturas/$invoiceId/analisis",
        params: { invoiceId: invoice.id },
      });
    } catch {
      setError(
        "No fue posible procesar el archivo. Puedes intentarlo de nuevo.",
      );
    } finally {
      setUploading(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="NUEVA CARGA"
        title="Cargar documento"
        description="Selecciona una factura para iniciar el análisis simulado."
        action={
          <Link to="/facturas" className="button button-ghost">
            <ArrowLeft size={17} /> Volver a la bandeja
          </Link>
        }
      />
      <ProcessingTimeline active={uploading ? 1 : 0} />
      <div className="upload-layout">
        <section className="card upload-card">
          <div className="card-heading">
            <div>
              <h2>Factura de proveedor</h2>
              <p>PDF o imagen escaneada · máximo 10 MB</p>
            </div>
            <Badge tone="info">Simulado</Badge>
          </div>
          <label className={`dropzone ${file ? "has-file" : ""}`}>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <FileUp size={30} />
            <strong>
              {file ? file.name : "Selecciona o arrastra un archivo"}
            </strong>
            <span>
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type}`
                : "PDF, PNG o JPG"}
            </span>
          </label>
          {error && (
            <div className="inline-error">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <div className="upload-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setError("");
              }}
              disabled={!file}
            >
              Limpiar
            </Button>
            <Button onClick={submit} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="spin" size={16} /> Procesando…
                </>
              ) : (
                <>
                  Iniciar análisis <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </section>
        <section className="card steps-card">
          <div className="card-heading">
            <div>
              <h2>Qué ocurrirá después</h2>
              <p>Flujo de carga</p>
            </div>
          </div>
          <ol className="process-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Recepción</strong>
                <p>Tipo y tamaño se validan en el navegador.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Extracción simulada</strong>
                <p>Se muestran campos sintéticos y su fuente.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Comparación</strong>
                <p>Se relacionan contrato, OC y soportes.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Revisión humana</strong>
                <p>
                  Las excepciones nunca se presentan como aprobación automática.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}
function DocumentViewer({ invoice }: { invoice: Invoice }) {
  return (
    <section id="invoice-document" className="document-viewer card">
      <div className="viewer-toolbar">
        <div>
          <FileText size={16} />
          <strong>{invoice.fileName}</strong>
        </div>
        <Badge tone="neutral">Documento sintético</Badge>
      </div>
      <div className="document-page">
        <div className="paper">
          <div className="paper-head">
            <div className="paper-logo">SA</div>
            <div>
              <strong>SERVICIOS ANDINOS</strong>
              <small>Factura electrónica de venta</small>
            </div>
            <span>{invoice.invoiceNumber}</span>
          </div>
          <div className="paper-line wide" />
          <div className="paper-grid">
            <div>
              <small>Proveedor</small>
              <strong>{invoice.supplier.name}</strong>
              <small>NIT {invoice.supplier.nit}</small>
            </div>
            <div>
              <small>Fecha emisión</small>
              <strong>{formatDate(invoice.date)}</strong>
              <small>Pago: 30 días</small>
            </div>
          </div>
          <div className="paper-table">
            <div>
              <span>Descripción</span>
              <span>Valor</span>
            </div>
            <div>
              <span>Servicios de operación y soporte</span>
              <strong>{formatCop(invoice.total)}</strong>
            </div>
            <div>
              <span>IVA 19%</span>
              <strong>
                {formatCop(
                  invoice.extraction.fields.find((f) => f.key === "tax")?.value,
                )}
              </strong>
            </div>
          </div>
          <div className="paper-total">
            <span>Total a pagar</span>
            <strong>{formatCop(invoice.total)}</strong>
          </div>
          <div className="paper-stamp">COPIA DE DEMOSTRACIÓN</div>
        </div>
      </div>
      <div className="viewer-footer">
        <span>Página 1 de 1</span>
        <span>Vista previa representativa</span>
      </div>
    </section>
  );
}
function ExtractionPanel({ invoice }: { invoice: Invoice }) {
  const displayFieldValue = (key: string, value?: string) => {
    if (value == null) return "No disponible";
    if (["subtotal", "tax", "withholding", "total"].includes(key))
      return formatCop(value);
    if (key === "date") return formatDate(value);
    return value;
  };
  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Extracción documental</h2>
          <p>Campos extraídos del documento sintético</p>
        </div>
        <Badge tone="success">Completa</Badge>
      </div>
      <div className="field-grid">
        {invoice.extraction.fields.map((field) => (
          <div className="field-row" key={field.key}>
            <div>
              <span>{field.label}</span>
              <strong>{displayFieldValue(field.key, field.value)}</strong>
            </div>
            <div className="field-meta">
              <VerificationStatus status={field.verification} />
              <ConfidenceIndicator
                confidence={field.confidence}
                source={field.source}
                compact
              />
            </div>
          </div>
        ))}
      </div>
      {invoice.extraction.missingFields.length > 0 && (
        <div className="missing-callout">
          <AlertTriangle size={16} />
          <span>
            Campos faltantes: {invoice.extraction.missingFields.join(", ")}
          </span>
        </div>
      )}
    </section>
  );
}
function RelatedDocuments({ invoice }: { invoice: Invoice }) {
  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Documentos relacionados</h2>
          <p>Relaciones documentales del escenario</p>
        </div>
        <Badge tone="info">Fixtures</Badge>
      </div>
      <div className="related-list">
        {invoice.relatedDocuments.map(({ document, explanation }) => (
          <div className="related-item" key={document.id}>
            <div className={`related-icon ${document.status}`}>
              <FileCheck2 size={17} />
            </div>
            <div className="related-copy">
              <strong>{document.name}</strong>
              <span>
                {document.type.replace("-", " ")} · {document.reference}
              </span>
              <details className="related-details">
                <summary>Ver detalle de relación</summary>
                <small>{document.evidence ?? explanation}</small>
              </details>
            </div>
            <Badge
              tone={
                document.status === "encontrado"
                  ? "success"
                  : document.status === "no-encontrado"
                    ? "warning"
                    : "neutral"
              }
            >
              {document.status.replace("-", " ")}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
function FindingCard({ finding }: { finding: ValidationFinding }) {
  return (
    <article className={`finding ${finding.severity}`}>
      <div className="finding-heading">
        <div className="finding-icon">
          {finding.severity === "info" ? (
            <CheckCircle2 size={17} />
          ) : (
            <ShieldAlert size={17} />
          )}
        </div>
        <div>
          <strong>{finding.title}</strong>
          <span>
            {finding.code} · {finding.result}
          </span>
        </div>
        <Badge
          tone={
            finding.severity === "critical"
              ? "danger"
              : finding.severity === "warning"
                ? "warning"
                : "success"
          }
        >
          {finding.requiresReview ? "Revisión requerida" : "Sin hallazgos"}
        </Badge>
      </div>
      <p className="finding-summary">
        {finding.severity === "info"
          ? "No se detectaron diferencias en esta validación."
          : "Requiere revisión antes de continuar."}
      </p>
      {finding.comparison && (
        <div className="comparison">
          <div>
            <span>{finding.comparison.leftLabel}</span>
            <strong>{finding.comparison.leftValue}</strong>
          </div>
          <div className="comparison-mark">−</div>
          <div>
            <span>{finding.comparison.rightLabel}</span>
            <strong>{finding.comparison.rightValue}</strong>
          </div>
          {finding.comparison.difference && (
            <div className="difference">
              <span>Diferencia</span>
              <strong>{finding.comparison.difference}</strong>
            </div>
          )}
        </div>
      )}
      <details className="finding-details">
        <summary>Ver explicación y evidencia</summary>
        <p>{finding.description}</p>
        <div className="evidence">
          <strong>Evidencia documental</strong>
          {finding.evidence.map((item) => (
            <span key={item.reference}>
              <FileText size={14} /> {item.label}: {item.reference} ·{" "}
              {item.detail}
            </span>
          ))}
        </div>
      </details>
    </article>
  );
}
function ValidationPanel({ invoice }: { invoice: Invoice }) {
  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Validaciones y excepciones</h2>
          <p>Hallazgos observados; no son decisiones contables</p>
        </div>
        <Badge
          tone={
            invoice.validations.some((v) => v.requiresReview)
              ? "warning"
              : "success"
          }
        >
          {invoice.validations.filter((v) => v.requiresReview).length} requieren
          atención
        </Badge>
      </div>
      <div className="findings-list">
        {invoice.validations.map((finding) => (
          <FindingCard finding={finding} key={finding.id} />
        ))}
      </div>
    </section>
  );
}
export function AnalysisPage() {
  const { invoiceId } = useParams({ from: "/facturas/$invoiceId/analisis" });
  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceApi.get(invoiceId),
  });
  if (invoiceQuery.isError)
    return (
      <StatePanel
        kind="error"
        title="No encontramos la factura"
        message="El identificador no existe en los fixtures disponibles."
      />
    );
  if (invoiceQuery.isPending || !invoiceQuery.data)
    return (
      <StatePanel
        kind="loading"
        title="Preparando análisis"
        message="Cargando extracción y documentos relacionados…"
      />
    );
  const invoice = invoiceQuery.data;
  return (
    <>
      <PageHeader
        eyebrow="ANÁLISIS DOCUMENTAL"
        title={invoice.invoiceNumber}
        description={`${invoice.supplier.name} · ${formatDate(invoice.date)}`}
        action={
          <div className="header-actions">
            <Link to="/facturas" className="button button-ghost">
              <ArrowLeft size={16} /> Bandeja
            </Link>
            <Link
              to="/facturas/$invoiceId/causacion"
              params={{ invoiceId }}
              className="button button-primary"
            >
              Ver propuesta <ArrowRight size={16} />
            </Link>
          </div>
        }
      />
      <div className="case-context-bar" aria-label="Contexto del caso">
        <span className="case-context-id">{invoice.invoiceNumber}</span>
        <Badge
          tone={
            invoice.reviewStatus === "requiere-revision" ? "warning" : "success"
          }
        >
          {invoice.reviewStatus === "requiere-revision"
            ? "Requiere revisión"
            : "Sin diferencias"}
        </Badge>
        <span className="case-context-total">
          Total {formatCop(invoice.total)}
        </span>
      </div>
      <ExceptionSummary invoice={invoice} />
      <a className="mobile-document-link" href="#invoice-document">
        <FileText size={15} /> Ver documento original <ArrowRight size={14} />
      </a>
      <div className="analysis-layout">
        <DocumentViewer invoice={invoice} />
        <div className="analysis-results">
          <ExtractionPanel invoice={invoice} />
          <RelatedDocuments invoice={invoice} />
          <ValidationPanel invoice={invoice} />
        </div>
      </div>
    </>
  );
}

const actionLabels: Record<HumanReviewAction, string> = {
  "solicitar-revision": "Solicitar revisión",
  "registrar-observacion": "Registrar observación",
  "verificar-duplicado": "Solicitar verificación de duplicado",
  "solicitar-soporte": "Solicitar soporte faltante",
  "corregir-extraccion": "Solicitar corrección de extracción",
};

function actionDescription(action: HumanReviewAction) {
  if (action === "verificar-duplicado")
    return "Deja constancia de que la coincidencia debe ser verificada por una persona responsable.";
  if (action === "solicitar-soporte")
    return "Deja constancia de que el soporte ausente debe solicitarse antes de continuar.";
  if (action === "corregir-extraccion")
    return "Deja constancia de que los campos inciertos requieren corrección en el flujo de backend.";
  if (action === "registrar-observacion")
    return "La observación queda asociada al caso sintético y no cambia sus importes ni validaciones.";
  return "La factura queda marcada como revisada en esta demostración, sin aprobar causación ni pagos.";
}

function defaultReviewObservation(invoice: Invoice, action: HumanReviewAction) {
  const finding = getPrimaryFinding(invoice);
  const context = finding ? ` Motivo: ${finding.title}.` : "";
  if (action === "registrar-observacion")
    return `Revisar el caso antes de continuar.${context}`;
  if (action === "verificar-duplicado")
    return `Verificar la coincidencia documental.${context}`;
  if (action === "solicitar-soporte")
    return "Solicitar el soporte documental faltante.";
  if (action === "corregir-extraccion")
    return "Revisar y corregir los campos de extracción afectados.";
  return `Solicitar revisión humana del caso.${context}`;
}

function ReviewActionDialog({
  invoiceId,
  action,
  defaultObservation,
  onClose,
  onSaved,
}: {
  invoiceId: string;
  action: HumanReviewAction;
  defaultObservation: string;
  onClose: () => void;
  onSaved: (event: HumanReviewEvent) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [observation, setObservation] = useState(defaultObservation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!observation.trim()) {
      setError("Escribe una observación para dejar contexto de la acción.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await reviewApi.record(invoiceId, action, observation);
      await queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onSaved(saved);
    } catch {
      setError(
        "No fue posible registrar la acción simulada. Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby="review-dialog-title"
      onCancel={onClose}
    >
      <form onSubmit={save}>
        <div className="dialog-heading">
          <div>
            <div className="eyebrow">MODO DEMOSTRACIÓN</div>
            <h2 id="review-dialog-title">{actionLabels[action]}</h2>
          </div>
          <button type="button" className="dialog-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <p>{actionDescription(action)}</p>
        <label className="dialog-field">
          <span>Observación</span>
          <textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Describe qué debe revisar la persona responsable…"
            rows={4}
            autoFocus
          />
        </label>
        {error && (
          <div className="inline-error" role="alert">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="spin" size={16} /> Guardando…
              </>
            ) : (
              <>
                Confirmar acción <CheckCircle2 size={16} />
              </>
            )}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function ReviewHistory({ history }: { history: HumanReviewEvent[] }) {
  if (!history.length) return null;
  return (
    <div className="review-history" aria-label="Historial de revisión simulada">
      <strong>Historial de acciones simuladas</strong>
      {history.map((event) => (
        <div className="review-history-item" key={event.id}>
          <ClipboardCheck size={16} />
          <div>
            <strong>{actionLabels[event.action]}</strong>
            <span>
              {event.observation} ·{" "}
              {new Date(event.createdAt).toLocaleString("es-CO")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NextActions({
  invoice,
  onAction,
}: {
  invoice: Invoice;
  onAction: (action: HumanReviewAction) => void;
}) {
  const scenarioAction: HumanReviewAction | undefined =
    invoice.scenario === "duplicate"
      ? "verificar-duplicado"
      : invoice.scenario === "missing-support"
        ? "solicitar-soporte"
        : invoice.extraction.status === "error" ||
            invoice.extraction.uncertainFields.length
          ? "corregir-extraccion"
          : undefined;
  const history = invoice.humanReview.history ?? [];
  const pendingInvoicesQuery = useQuery({
    queryKey: ["invoices", "next-pending"],
    queryFn: () => invoiceApi.list(),
    enabled: history.length > 0,
  });
  const nextInvoice = pendingInvoicesQuery.data?.find(
    (candidate) =>
      candidate.id !== invoice.id && candidate.reviewStatus !== "revisada",
  );
  return (
    <section
      className="card next-actions-card"
      aria-labelledby="next-actions-title"
    >
      <div className="card-heading">
        <div>
          <h2 id="next-actions-title">Siguientes acciones</h2>
          <p>Continúa la revisión sin aprobar causación ni registrar pagos.</p>
        </div>
        <Badge tone={history.length ? "success" : "warning"}>
          {history.length ? "Acción registrada" : "Pendiente"}
        </Badge>
      </div>
      <div className="next-actions-list">
        <Button onClick={() => onAction("solicitar-revision")}>
          <ClipboardCheck size={16} /> Solicitar revisión
        </Button>
        {scenarioAction && (
          <Button variant="secondary" onClick={() => onAction(scenarioAction)}>
            <AlertTriangle size={16} /> {actionLabels[scenarioAction]}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => onAction("registrar-observacion")}
        >
          <MessageSquare size={16} /> Registrar observación
        </Button>
      </div>
      <div className="next-actions-nav">
        <Link
          to="/facturas/$invoiceId/analisis"
          params={{ invoiceId: invoice.id }}
          className="button button-ghost"
        >
          <FileText size={16} /> Ver documentos y evidencia
        </Link>
        <Link to="/facturas" className="button button-ghost">
          <ArrowLeft size={16} /> Volver a la bandeja
        </Link>
        {nextInvoice && (
          <Link
            to="/facturas/$invoiceId/analisis"
            params={{ invoiceId: nextInvoice.id }}
            className="button button-ghost"
          >
            <ArrowRight size={16} /> Siguiente factura pendiente:{" "}
            {nextInvoice.invoiceNumber}
          </Link>
        )}
      </div>
      <ReviewHistory history={history} />
    </section>
  );
}

export function CausationPage() {
  const { invoiceId } = useParams({ from: "/facturas/$invoiceId/causacion" });
  const [selectedAction, setSelectedAction] =
    useState<HumanReviewAction | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceApi.get(invoiceId),
  });
  if (invoiceQuery.isError)
    return (
      <StatePanel
        kind="error"
        title="No encontramos la factura"
        message="El identificador no existe o la API no respondió correctamente."
      />
    );
  if (invoiceQuery.isPending || !invoiceQuery.data)
    return (
      <StatePanel
        kind="loading"
        title="Preparando propuesta"
        message="Cargando datos extraídos y validaciones…"
      />
    );
  const invoice = invoiceQuery.data;
  const p = invoice.causation;
  return (
    <>
      <PageHeader
        eyebrow="PROPUESTA DE CAUSACIÓN"
        title="Revisión de propuesta"
        description={`${invoice.invoiceNumber} · ${invoice.supplier.name}`}
        action={
          <Link
            to="/facturas/$invoiceId/analisis"
            params={{ invoiceId }}
            className="button button-ghost"
          >
            <ArrowLeft size={17} /> Volver al análisis
          </Link>
        }
      />
      <div className="case-context-bar" aria-label="Contexto del caso">
        <span className="case-context-id">{invoice.invoiceNumber}</span>
        <Badge tone="warning">Revisión humana pendiente</Badge>
        <span className="case-context-total">
          Total {formatCop(invoice.total)}
        </span>
      </div>
      <ExceptionSummary invoice={invoice} />
      <StepRail active={2} />
      <ReviewCallout invoice={invoice} />
      <div className="causation-grid">
        <section className="card">
          <div className="card-heading">
            <div>
              <h2>1. Información extraída</h2>
              <p>Valores observados en la factura</p>
            </div>
            <Badge tone="success">Extraído</Badge>
          </div>
          <div className="summary-list">
            <div>
              <span>Proveedor</span>
              <strong>{p.supplier.name}</strong>
            </div>
            <div>
              <span>NIT</span>
              <strong>{p.supplier.nit}</strong>
            </div>
            <div>
              <span>Factura</span>
              <strong>{p.invoiceNumber}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong className="big-money">{formatCop(p.total)}</strong>
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-heading">
            <div>
              <h2>2. Validaciones realizadas</h2>
              <p>Excepciones que condicionan la propuesta</p>
            </div>
            <Badge
              tone={
                invoice.validations.some((v) => v.requiresReview)
                  ? "warning"
                  : "success"
              }
            >
              {invoice.validations.length} resultados
            </Badge>
          </div>
          <div className="causation-validations">
            {invoice.validations.map((v) => (
              <div key={v.id}>
                <span
                  className={`mini-status ${v.requiresReview ? "warning" : "success"}`}
                >
                  {v.requiresReview ? (
                    <AlertTriangle size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                </span>
                <div>
                  <strong>{v.title}</strong>
                  <small>{v.result}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card proposal-card">
          <div className="card-heading">
            <div>
              <h2>3. Propuesta contable</h2>
              <p>Sugerencia pendiente de confirmación</p>
            </div>
            <Badge tone={p.status === "requiere-revision" ? "warning" : "info"}>
              {p.status === "requiere-revision" ? "No aprobada" : "Sugerida"}
            </Badge>
          </div>
          <div className="proposal-fields">
            <div>
              <span>Cuenta contable</span>
              <strong>{p.account ?? "No disponible"}</strong>
            </div>
            <div>
              <span>Centro de costo</span>
              <strong>{p.costCenter ?? "No disponible"}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatCop(p.subtotal)}</strong>
            </div>
            <div>
              <span>IVA</span>
              <strong>{formatCop(p.tax)}</strong>
            </div>
            <div className="total-row">
              <span>Total propuesta</span>
              <strong>{formatCop(p.total)}</strong>
            </div>
          </div>
        </section>
        <section className="card review-card">
          <div className="card-heading">
            <div>
              <h2>4. Decisión o revisión humana</h2>
              <p>Revisión humana pendiente</p>
            </div>
            <Badge tone="warning">Pendiente</Badge>
          </div>
          <div className="human-review">
            <div className="review-avatar">
              <ShieldAlert size={22} />
            </div>
            <div>
              <strong>
                {p.exceptions.length
                  ? "No se recomienda causación automática"
                  : "Confirmación humana recomendada"}
              </strong>
              <p>
                {p.exceptions.length
                  ? p.exceptions.join(" · ")
                  : "Una persona responsable debe revisar la propuesta antes de registrarla."}
              </p>
            </div>
          </div>
          <p className="review-status-note">
            {invoice.humanReview.history?.length
              ? "La revisión simulada quedó registrada. La causación continúa pendiente de autorización empresarial."
              : "Selecciona una acción contextual abajo para dejar trazabilidad de la revisión."}
          </p>
        </section>
        <NextActions invoice={invoice} onAction={setSelectedAction} />
      </div>
      {savedMessage && (
        <div className="notice success-banner" role="status">
          <CheckCircle2 size={18} /> <span>{savedMessage}</span>
        </div>
      )}
      {selectedAction && (
        <ReviewActionDialog
          invoiceId={invoice.id}
          action={selectedAction}
          defaultObservation={defaultReviewObservation(invoice, selectedAction)}
          onClose={() => setSelectedAction(null)}
          onSaved={(event) => {
            setSelectedAction(null);
            setSavedMessage(
              `${actionLabels[event.action]} registrada en modo demostración.`,
            );
          }}
        />
      )}
    </>
  );
}
