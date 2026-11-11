import type { Invoice } from "../shared/types";
const supplier = {
  id: "sup-acme",
  name: "Servicios Integrales Andinos S.A.S.",
  nit: "900.481.220-7",
};
const fields = (
  total: string,
  invoiceNumber: string,
  confidenceProfile: "medium" | "low" | undefined = undefined,
) => [
  {
    key: "supplier",
    label: "Proveedor",
    value: supplier.name,
    source: "Factura pág. 1",
    confidence: 0.99,
    verification: "verificado" as const,
  },
  {
    key: "nit",
    label: "NIT",
    value: supplier.nit,
    source: "Factura pág. 1",
    confidence: 0.98,
    verification: "verificado" as const,
  },
  {
    key: "invoiceNumber",
    label: "Número de factura",
    value: invoiceNumber,
    source: "Factura pág. 1",
    confidence: 0.97,
    verification: "verificado" as const,
  },
  {
    key: "date",
    label: "Fecha",
    value: "2026-10-28",
    source: "Factura pág. 1",
    confidence: 0.96,
    verification: "verificado" as const,
  },
  {
    key: "subtotal",
    label: "Subtotal",
    value: total === "52000000" ? "43697479" : "42016807",
    source: "Factura pág. 1",
    confidence:
      confidenceProfile === "low"
        ? 0.76
        : confidenceProfile === "medium"
          ? 0.84
          : 0.97,
    verification: "verificado" as const,
  },
  {
    key: "tax",
    label: "IVA",
    value: total === "52000000" ? "8302521" : "7983193",
    source: "Factura pág. 1",
    confidence: 0.95,
    verification: "verificado" as const,
  },
  {
    key: "withholding",
    label: "Retenciones",
    value: "0",
    source: "Factura pág. 1",
    confidence: 0.91,
    verification: "verificado" as const,
  },
  {
    key: "total",
    label: "Total",
    value: total,
    source: "Factura pág. 1",
    confidence: 0.99,
    verification: "verificado" as const,
  },
];
const commonDocs = (support: "found" | "missing" = "found") => [
  {
    document: {
      id: "contract-2026-014",
      type: "contrato" as const,
      reference: "CTR-2026-014",
      name: "Contrato servicios operativos",
      status: "encontrado" as const,
      evidence: "Coincidencia por NIT y periodo contractual",
    },
    explanation:
      "Relación simulada a partir de identificadores de proveedor y periodo.",
  },
  {
    document: {
      id: "po-8841",
      type: "orden-compra" as const,
      reference: "OC-8841",
      name: "Orden de compra servicios",
      status: "encontrado" as const,
      evidence: "Referencia localizada en conjunto sintético",
    },
    explanation:
      "Documento relacionado disponible en el fixture de demostración.",
  },
  {
    document: {
      id: "support-77",
      type: "soporte" as const,
      reference: "SOP-77",
      name: "Acta de servicio recibido",
      status:
        support === "found"
          ? ("encontrado" as const)
          : ("no-encontrado" as const),
      evidence:
        support === "found" ? "Acta sintética asociada a la orden" : undefined,
    },
    explanation:
      support === "found"
        ? "Soporte presente en el escenario simulado."
        : "No se encontró el soporte requerido dentro del conjunto de demostración.",
  },
];
const base = (
  id: string,
  scenario: Invoice["scenario"],
  total: string,
): Invoice => {
  const difference = scenario === "difference";
  const duplicate = scenario === "duplicate";
  const missing = scenario === "missing-support";
  const validations = difference
    ? [
        {
          id: "val-amount",
          code: "VAL-001",
          title: "Diferencia frente a orden de compra",
          result: "Diferencia detectada",
          description:
            "La factura supera el valor registrado en la orden de compra. El origen exacto requiere investigación humana.",
          severity: "critical" as const,
          evidence: [
            {
              label: "Factura",
              reference: "FE-10482",
              detail: "$52.000.000 COP",
            },
            {
              label: "Orden de compra",
              reference: "OC-8841",
              detail: "$50.000.000 COP",
            },
          ],
          comparison: {
            leftLabel: "Factura",
            leftValue: "$52.000.000",
            rightLabel: "Orden de compra",
            rightValue: "$50.000.000",
            difference: "$2.000.000",
          },
          requiresReview: true,
        },
      ]
    : duplicate
      ? [
          {
            id: "val-duplicate",
            code: "DUP-002",
            title: "Posible factura duplicada",
            result: "Coincidencia probable",
            description:
              "Existe otra factura sintética con proveedor y valor coincidentes. No constituye una decisión definitiva de duplicidad.",
            severity: "warning" as const,
            evidence: [
              {
                label: "Factura coincidente",
                reference: "FE-10481",
                detail: "Mismo proveedor y total",
              },
            ],
            requiresReview: true,
          },
        ]
      : missing
        ? [
            {
              id: "val-support",
              code: "SUP-003",
              title: "Soporte faltante",
              result: "Documento no encontrado",
              description:
                "El acta de servicio requerido no está disponible en el caso de demostración.",
              severity: "warning" as const,
              evidence: [
                {
                  label: "Soporte requerido",
                  reference: "SOP-77",
                  detail: "No disponible",
                },
              ],
              requiresReview: true,
            },
          ]
        : [
            {
              id: "val-ok",
              code: "VAL-000",
              title: "Validaciones sin hallazgos",
              result: "Sin diferencias detectadas",
              description:
                "Los valores sintéticos están alineados con los documentos relacionados.",
              severity: "info" as const,
              evidence: [
                {
                  label: "Conjunto de prueba",
                  reference: "FIX-NORMAL",
                  detail: "Comparación completada",
                },
              ],
              requiresReview: false,
            },
          ];
  const invoiceNumber = difference
    ? "FE-10482"
    : duplicate
      ? "FE-10481"
      : missing
        ? "FE-10483"
        : "FE-10480";
  return {
    id,
    supplier,
    invoiceNumber,
    date: "2026-10-28",
    total,
    currency: "COP",
    fileName: scenario === "missing-support" ? `${id}.png` : `${id}.pdf`,
    fileType: scenario === "missing-support" ? "image" : "pdf",
    scenario,
    processingStatus: "validada",
    reviewStatus: validations.some((v) => v.requiresReview)
      ? "requiere-revision"
      : "sin-revision",
    extraction: {
      status: "completa",
      fields: fields(
        total,
        invoiceNumber,
        duplicate ? "medium" : missing ? "low" : undefined,
      ),
      lines: [
        {
          id: "line-1",
          description: "Servicios de operación y soporte",
          quantity: "1",
          unitPrice: total,
          total,
        },
      ],
      missingFields: missing ? ["Centro de costo"] : [],
      uncertainFields: duplicate ? ["Subtotal"] : [],
    },
    relatedDocuments: commonDocs(missing ? "missing" : "found"),
    validations,
    causation: {
      supplier,
      invoiceNumber,
      subtotal: total === "52000000" ? "43697479" : "42016807",
      tax: total === "52000000" ? "8302521" : "7983193",
      total,
      account: missing ? undefined : "513515 - Servicios tecnológicos",
      costCenter: missing ? undefined : "CC-042 - Operaciones",
      status: validations.some((v) => v.requiresReview)
        ? "requiere-revision"
        : "propuesta",
      exceptions: validations
        .filter((v) => v.requiresReview)
        .map((v) => v.title),
      disclaimer:
        "Propuesta simulada. No representa una causación ejecutada en un ERP.",
    },
    humanReview: {
      required: validations.some((v) => v.requiresReview),
      reason: validations.find((v) => v.requiresReview)?.description,
      status: "pendiente",
    },
  };
};
export const invoiceFixtures: Invoice[] = [
  base("INV-001", "normal", "49935000"),
  base("INV-002", "difference", "52000000"),
  base("INV-003", "duplicate", "12350000"),
  base("INV-004", "missing-support", "8750000"),
];
