(() => {
  "use strict";

  const d = document;
  const $ = (selector, context = d) => context.querySelector(selector);
  const $$ = (selector, context = d) => [...context.querySelectorAll(selector)];
  const safe = (fn) => {
    try {
      fn();
    } catch (error) {
      console.warn("[ai-invoice-processor]", error);
    }
  };
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const canAnimate = !reducedMotion && typeof window.gsap !== "undefined";

  const roleProfiles = {
    aprobador: {
      code: "MC",
      name: "María Contable",
      title: "Aprobadora autorizada",
      short: "María C. · Aprobadora",
      workspace: "Finanzas · Aprobación",
      canCorrect: true,
      canAuthorize: true,
      canApprove: true,
    },
    revisor: {
      code: "JR",
      name: "Julián Revisor",
      title: "Revisor financiero",
      short: "Julián R. · Revisor",
      workspace: "Finanzas · Revisión",
      canCorrect: true,
      canAuthorize: false,
      canApprove: false,
    },
    lector: {
      code: "AU",
      name: "Auditoría Interna",
      title: "Consulta y auditoría",
      short: "Auditoría · Lectura",
      workspace: "Finanzas · Consulta",
      canCorrect: false,
      canAuthorize: false,
      canApprove: false,
    },
  };

  let currentRole = sessionStorage.getItem("aip_role") || "aprobador";
  if (!roleProfiles[currentRole]) currentRole = "aprobador";

  const cases = {
    "FE-9001": {
      invoiceId: "INV-001",
      status: "review",
      businessState: "EXCEPCION",
      statusLabel: "Requiere revisión",
      subtitle:
        "Caso principal · Validación ejecutada · Sin aprobación automática",
      vendor: "Servicios Integrados Colombia S.A.S.",
      nit: "NIT 900654321-0 · DV válido",
      invoice: "FE-9001",
      date: "20 sep 2026 · Periodo abierto",
      contract: "CT-01 · Vigente",
      order: "OC-9001 ($50.000.000)",
      supportCount: "0",
      confidence: "7 correctas · 1 alerta",
      matchTitle: "Cálculo correcto, pero supera la orden",
      matchSubtitle: "Comparamos subtotal contra subtotal antes de IVA",
      comparisons: [
        {
          icon: "ok",
          symbol: "✓",
          title: "Aritmética e IVA",
          detail: "Subtotal $52 M más IVA $9,88 M cuadra con el total",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas V1 a V4 · Aritmética e IVA",
          breakdown: [
            { label: "Subtotal base", val: "$52.000.000" },
            { label: "IVA 19 %", val: "$9.880.000" },
            { label: "Total calculado", val: "$61.880.000", highlight: "ok" },
            { label: "Tolerancia", val: "≤ 1 COP" },
          ],
          note: "La suma de líneas y el cálculo de IVA del 19 % coinciden exactamente con el total declarado en la factura.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Identidad y fecha",
          detail: "NIT 900654321-0 válido y proveedor coincide",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas V5 a V7 y D1 · Identidad y Contrato",
          breakdown: [
            { label: "NIT emisor", val: "900654321-0" },
            { label: "Dígito DV", val: "Válido (DIAN M11)" },
            { label: "Contrato", val: "CT-01 (Vigente)" },
            { label: "Duplicidad", val: "Sin duplicados", highlight: "ok" },
          ],
          note: "Proveedor registrado en catálogo institucional con contrato marco vigente y periodo contable sep 2026 abierto.",
        },
        {
          icon: "warning",
          symbol: "!",
          title: "Orden de compra",
          detail: "OC autoriza $50.000.000 y factura cobra $52.000.000",
          value: "+4,00 %",
          tone: "warning",
          rules: "Regla D2 · Cruce con Orden de Compra",
          breakdown: [
            { label: "Base autorizada OC", val: "$50.000.000" },
            { label: "Base facturada", val: "$52.000.000" },
            {
              label: "Diferencia neta",
              val: "+$2.000.000",
              highlight: "warning",
            },
            { label: "Desviación (%)", val: "+4,00 %", highlight: "warning" },
          ],
          note: "La factura supera el subtotal autorizado en la orden OC-9001. La causación en cuenta 5135 queda bloqueada preventivamente.",
        },
      ],
      exceptionTitle: "Diferencia comercial de $2.000.000 (4,00 %)",
      exceptionCopy:
        "Subtotal OC <strong>COP 50.000.000</strong>; subtotal factura <strong>COP 52.000.000</strong>. Total OC con IVA COP 59.500.000; factura con IVA COP 61.880.000.",
      proposalStatus: "Bloqueada",
      proposalPill: "pill--review",
      proposalAccount: "5135 · Servicios / CC-01",
      proposalBase: "$50.000.000",
      proposalDiff: "$2.000.000 (4,00 %)",
      secondaryActionType: "authorize",
      secondaryAction: "Autorizar diferencia con soporte",
      primaryAction: 'Aprobar propuesta <span aria-hidden="true">→</span>',
      audit:
        "<strong>Historial del caso (FE-9001):</strong> 09:00 Factura recibida · 09:01 Datos extraídos · 09:02 OC vinculada · 09:03 Diferencia de $2 M registrada · 09:10 En espera de soporte.",
      timeline: [
        {
          dot: "blue",
          time: "09:00 · Factura recibida y datos extraídos",
          detail:
            "Archivo DOC-001 registrado con hash. Líneas e impuestos leídos sin errores.",
          tag: "Recibida",
        },
        {
          dot: "blue",
          time: "09:02 · Orden de compra y contrato vinculados",
          detail:
            "Se asocia la orden DOC-OC-9001 ($50.000.000) y el contrato vigente DOC-CT-01.",
          tag: "Asociada",
        },
        {
          dot: "amber",
          time: "09:03 · Diferencia detectada frente a la orden (Regla D2)",
          detail:
            "Subtotal factura COP 52.000.000 frente a subtotal OC COP 50.000.000 (+4,00 %).",
          tag: "Excepción",
        },
        {
          dot: "amber",
          time: "09:10 · Revisión humana solicitada",
          detail:
            "La propuesta queda bloqueada hasta adjuntar autorización o corregir.",
          tag: "Pendiente",
        },
      ],
      docs: {
        invoice: {
          preview: "Factura electrónica (DOC-001)",
          badge: "[SINTÉTICO · COP]",
          kind: "Representación gráfica · Factura de venta",
          number: "FE-9001",
          rows: [
            [
              "Servicios especializados de operación (sin descuento)",
              "1",
              "$52.000.000",
              "$52.000.000",
            ],
            [
              "Valor autorizado en Orden de Compra OC-9001",
              "1",
              "$50.000.000",
              "Base OC",
            ],
          ],
          subtotal: "$52.000.000",
          iva: "$9.880.000",
          total: "$61.880.000",
          footer:
            "Retenciones ($3.926.000) y neto a pagar ($57.954.000) informados por separado: no se restan del total facturado ni se validan automáticamente.",
        },
        purchase: {
          preview: "Orden de compra (DOC-OC-9001)",
          badge: "[BASE OFICIAL · D2]",
          kind: "Orden de compra autorizada",
          number: "OC-9001",
          rows: [
            [
              "Cupo autorizado para servicios especializados (subtotal comparable)",
              "1",
              "$50.000.000",
              "$50.000.000",
            ],
            [
              "Diferencia detectada contra FE-9001 (+4,00 % sobre el subtotal)",
              "1",
              "+$2.000.000",
              "Alerta D2",
            ],
          ],
          subtotal: "$50.000.000",
          iva: "$9.500.000",
          total: "$59.500.000",
          footer:
            "Documento DOC-OC-9001. Siempre comparamos subtotal contra subtotal para no mezclar impuestos ni retenciones.",
        },
        contract: {
          preview: "Contrato marco (DOC-CT-01)",
          badge: "[CONTRATO · VIGENTE]",
          kind: "Contrato de prestación de servicios",
          number: "CT-01",
          rows: [
            [
              "Contrato activo dentro de fechas de vigencia (Regla D3 correcta)",
              "2026",
              "$50.000.000",
              "Vigente",
            ],
            [
              "Cuenta sugerida por catálogo: 5135 · Centro de costo CC-01",
              "1",
              "Catálogo",
              "Asignado",
            ],
          ],
          subtotal: "$50.000.000",
          iva: "$9.500.000",
          total: "$59.500.000",
          footer:
            "Documento DOC-CT-01. Superar el valor autorizado exige anexar adenda o autorización comercial.",
        },
        support: {
          preview: "Soportes y autorizaciones (Pendiente)",
          badge: "[FALTA AUTORIZACIÓN]",
          kind: "Respaldo para diferencia comercial",
          number: "PENDIENTE",
          rows: [
            [
              "Aún no se ha cargado autorización para los $2.000.000 adicionales",
              "0",
              "Pendiente",
              "Requerido",
            ],
            [
              "Usa el botón «Autorizar diferencia con soporte» para anexar el respaldo",
              "1",
              "Acción",
              "Disponible",
            ],
          ],
          subtotal: "$50.000.000",
          iva: "$9.500.000",
          total: "$59.500.000",
          footer:
            "Al autorizar la excepción se conserva el hallazgo original y queda registrado quién autorizó y con qué documento.",
        },
      },
    },
    "FE-1001": {
      invoiceId: "INV-002",
      status: "ready",
      businessState: "PROPUESTA",
      statusLabel: "Con propuesta",
      subtitle:
        "Escenario E01 · Todas las reglas cumplidas · Pendiente de aprobar",
      vendor: "Consultoría y Procesos Andinos S.A.S.",
      nit: "NIT 900123456-8 · DV válido",
      invoice: "FE-1001",
      date: "15 sep 2026 · Periodo abierto",
      contract: "CT-04 · Vigente",
      order: "OC-1001 ($1.000.000)",
      supportCount: "1",
      confidence: "9 correctas · 0 alertas",
      matchTitle: "Factura, orden y acta coinciden",
      matchSubtitle: "Propuesta preparada con el catálogo oficial",
      comparisons: [
        {
          icon: "ok",
          symbol: "✓",
          title: "Aritmética e IVA (V1 a V4)",
          detail: "Subtotal $1.000.000 más IVA $190.000 = $1.190.000",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas V1 a V4 · Aritmética",
          breakdown: [
            { label: "Subtotal base", val: "$1.000.000" },
            { label: "IVA 19 %", val: "$190.000" },
            { label: "Total liquidado", val: "$1.190.000", highlight: "ok" },
            { label: "Descuentos", val: "$0" },
          ],
          note: "Cálculos aritméticos internos e impuestos liquidados con precisión exacta sin diferencias.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Identidad y vigencia (V5 a V7)",
          detail: "NIT 900123456-8 con DV 8 correcto y sin duplicados",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas V5 a V7 · Tercero y Vigencia",
          breakdown: [
            { label: "NIT emisor", val: "900123456-8" },
            { label: "Dígito DV", val: "8 (Conforme)" },
            { label: "Periodo contable", val: "Abierto (Sep 2026)" },
            { label: "Duplicidad", val: "Única en base", highlight: "ok" },
          ],
          note: "Identidad del proveedor y fecha de emisión validadas conforme a normativa DIAN.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Orden y recepción (D1 a D5)",
          detail: "Coincide con OC-1001 y tiene acta firmada",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas D1 a D5 · Cruce Comercial",
          breakdown: [
            { label: "Orden OC-1001", val: "$1.000.000" },
            { label: "Factura FE-1001", val: "$1.000.000" },
            { label: "Soporte", val: "Acta REC-1001" },
            {
              label: "Cruce trilateral",
              val: "100 % conforme",
              highlight: "ok",
            },
          ],
          note: "Coincidencia exacta con la orden de compra y soporte de recepción debidamente firmado.",
        },
      ],
      exceptionTitle: "Validación limpia (sin excepciones)",
      exceptionCopy:
        "Todas las comprobaciones pasaron. El sistema prepara la propuesta, pero <strong>nunca aprueba ni contabiliza solo</strong>.",
      proposalStatus: "Lista para aprobar",
      proposalPill: "pill--ready",
      proposalAccount: "5135 · Servicios / CC-02",
      proposalBase: "$1.000.000",
      proposalDiff: "$0 (0,00 %)",
      secondaryActionType: "reject",
      secondaryAction: "Rechazar con motivo",
      primaryAction: 'Aprobar propuesta <span aria-hidden="true">→</span>',
      audit:
        "<strong>Historial del caso (FE-1001):</strong> Factura recibida · Datos extraídos · Documentos conciliados · Reglas V1 a V7 correctas · Propuesta lista.",
      timeline: [
        {
          dot: "blue",
          time: "08:40 · Factura recibida y leída",
          detail:
            "Archivo DOC-002 procesado con confianza alta en todos los campos.",
          tag: "Recibida",
        },
        {
          dot: "green",
          time: "08:42 · Validación completa sin alertas",
          detail: "Reglas V1 a V7 y cruces D1 a D4 superados con éxito.",
          tag: "Validada",
        },
        {
          dot: "green",
          time: "08:43 · Propuesta básica generada",
          detail:
            "Cuenta 5135 y centro CC-02 asignados en espera de aprobación humana.",
          tag: "Propuesta",
        },
      ],
      docs: {
        invoice: {
          preview: "Factura electrónica (DOC-002)",
          badge: "[VALIDADA · E01]",
          kind: "Representación gráfica · Factura conciliada",
          number: "FE-1001",
          rows: [
            [
              "Servicio profesional de soporte operativo",
              "1",
              "$1.000.000",
              "$1.000.000",
            ],
            [
              "IVA tarifa general 19 % sobre base gravada",
              "19%",
              "$1.000.000",
              "$190.000",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer:
            "Caso E01: Aunque el generador la etiquete como limpia, la aprobación final siempre es humana.",
        },
        purchase: {
          preview: "Orden de compra (DOC-OC-1001)",
          badge: "[CONCILIADA]",
          kind: "Orden de compra compatible",
          number: "OC-1001",
          rows: [
            [
              "Servicio profesional autorizado según cotización",
              "1",
              "$1.000.000",
              "$1.000.000",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer:
            "El subtotal facturado coincide exactamente con el valor autorizado en la orden.",
        },
        contract: {
          preview: "Contrato asociado (DOC-CT-04)",
          badge: "[VIGENTE]",
          kind: "Contrato de servicios profesionales",
          number: "CT-04",
          rows: [
            [
              "Contrato activo con saldo disponible y tarifas vigentes",
              "1",
              "$1.000.000",
              "Conforme",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer: "Prestación realizada dentro del plazo contractual.",
        },
        support: {
          preview: "Acta de recepción (DOC-REC-1001)",
          badge: "[ACTA FIRMADA]",
          kind: "Soporte de recepción conforme",
          number: "REC-1001",
          rows: [
            [
              "Acta de recibido a satisfacción por el total del servicio",
              "1",
              "$1.000.000",
              "Verificada",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer: "Cantidad y valor recibidos coinciden con la factura.",
        },
      },
    },
    "FE-1003": {
      invoiceId: "INV-003",
      status: "review",
      businessState: "EXCEPCION",
      statusLabel: "Error en total",
      subtitle:
        "Escenarios E03 y E07 · Desajuste en el total · Requiere corregir o rectificar",
      vendor: "Suministros Industriales del Norte S.A.S.",
      nit: "NIT 900456789-3 · DV válido",
      invoice: "FE-1003",
      date: "18 sep 2026 · Periodo abierto",
      contract: "CT-07 · Vigente",
      order: "OC-1003 ($1.000.000)",
      supportCount: "1",
      confidence: "8 correctas · 1 fallo V4",
      matchTitle: "El total no cuadra con subtotal más IVA",
      matchSubtitle: "Debería sumar $1.190.000, pero figura $1.300.000",
      comparisons: [
        {
          icon: "ok",
          symbol: "✓",
          title: "Líneas, subtotal e IVA (V1 a V3)",
          detail: "Subtotal $1.000.000 e IVA $190.000 correctos",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas V1 a V3 · Líneas e IVA",
          breakdown: [
            { label: "Ítems sumados", val: "2 líneas" },
            { label: "Subtotal base", val: "$1.000.000" },
            { label: "IVA 19 %", val: "$190.000", highlight: "ok" },
            { label: "Suma teórica", val: "$1.190.000" },
          ],
          note: "Los conceptos individuales y el impuesto liquidado corresponden al valor base de la operación.",
        },
        {
          icon: "warning",
          symbol: "!",
          title: "Total de la factura (Regla V4)",
          detail: "Suma esperada $1.190.000 vs. leído $1.300.000",
          value: "+$110.000",
          tone: "warning",
          rules: "Regla V4 · Total de Factura",
          breakdown: [
            { label: "Total esperado", val: "$1.190.000" },
            {
              label: "Total leído OCR",
              val: "$1.300.000",
              highlight: "warning",
            },
            { label: "Discrepancia", val: "+$110.000", highlight: "warning" },
            { label: "Causa raíz", val: "Lectura OCR" },
          ],
          note: "El total leído en el PDF ($1.300.000) no concuerda con subtotal + IVA ($1.190.000). Usa el botón «Corregir» para subsanar.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Proveedor y orden (D1 y D2)",
          detail: "El subtotal coincide con la orden OC-1003",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas D1 y D2 · Cruce Comercial",
          breakdown: [
            { label: "Orden vinculada", val: "OC-1003" },
            { label: "Base autorizada", val: "$1.000.000" },
            { label: "Base facturada", val: "$1.000.000", highlight: "ok" },
            { label: "Diferencia", val: "$0" },
          ],
          note: "El subtotal facturado coincide con el valor preautorizado en la orden de compra.",
        },
      ],
      exceptionTitle: "Desajuste de $110.000 en el total (Regla V4)",
      exceptionCopy:
        "Subtotal <strong>COP 1.000.000</strong> más IVA <strong>COP 190.000</strong> suma <strong>COP 1.190.000</strong>, pero el total registrado es <strong>COP 1.300.000</strong>. Si fue un error de lectura OCR, corrige el dato para volver a validar.",
      proposalStatus: "Anulada por V4",
      proposalPill: "pill--review",
      proposalAccount: "5135 · Mantenimiento / CC-03",
      proposalBase: "$1.190.000 (Esperado)",
      proposalDiff: "$110.000 (Error V4)",
      secondaryActionType: "correct",
      secondaryAction: "Corregir lectura y revalidar",
      primaryAction:
        'Solicitar factura corregida <span aria-hidden="true">→</span>',
      audit:
        "<strong>Historial del caso (FE-1003):</strong> Factura recibida · Lectura completada · Fallo en regla V4 ($110.000 de diferencia) · En espera de corrección.",
      timeline: [
        {
          dot: "blue",
          time: "09:15 · Factura recibida y leída por OCR",
          detail: "Se extrajo un total de $1.300.000 con alerta de revisión.",
          tag: "Extraída",
        },
        {
          dot: "amber",
          time: "09:16 · Fallo en regla V4 (Total no cuadra)",
          detail:
            "Subtotal ($1.000.000) + IVA ($190.000) = $1.190.000, distinto de $1.300.000.",
          tag: "Excepción",
        },
      ],
      docs: {
        invoice: {
          preview: "Factura electrónica (DOC-003)",
          badge: "[REVISAR LECTURA · V4]",
          kind: "Representación gráfica · Comparación con original",
          number: "FE-1003",
          rows: [
            [
              "Mantenimiento preventivo (3 uds × $200.000 menos desc. $50.000)",
              "3",
              "$200.000",
              "$550.000",
            ],
            [
              "Repuestos operativos verificados (3 uds × $150.000)",
              "3",
              "$150.000",
              "$450.000",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.300.000",
          footer:
            "En el PDF original el total es $1.190.000, pero el OCR leyó $1.300.000. Corregir el dato vuelve a correr las reglas sin alterar el PDF.",
        },
        purchase: {
          preview: "Orden de compra (DOC-OC-1003)",
          badge: "[OC CONFORME]",
          kind: "Orden de compra vinculada",
          number: "OC-1003",
          rows: [
            [
              "Mantenimiento y repuestos autorizados por $1.000.000 antes de IVA",
              "1",
              "$1.000.000",
              "$1.000.000",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer: "La orden respalda un total con IVA de $1.190.000.",
        },
        contract: {
          preview: "Contrato asociado (DOC-CT-07)",
          badge: "[VIGENTE]",
          kind: "Contrato de mantenimiento",
          number: "CT-07",
          rows: [
            [
              "Tarifas y descuentos acordados vigentes",
              "1",
              "$1.000.000",
              "Vigente",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer: "Sin observaciones en el contrato.",
        },
        support: {
          preview: "Acta de recepción (DOC-REC-1003)",
          badge: "[ACTA CONFORME]",
          kind: "Soporte de servicio recibido",
          number: "REC-1003",
          rows: [
            [
              "Servicio recibido por valor base de $1.000.000",
              "1",
              "$1.000.000",
              "Conforme",
            ],
          ],
          subtotal: "$1.000.000",
          iva: "$190.000",
          total: "$1.190.000",
          footer: "Confirma que el valor correcto con IVA es $1.190.000.",
        },
      },
    },
    "FE-1006": {
      invoiceId: "INV-006",
      status: "review",
      businessState: "EXCEPCION",
      statusLabel: "Falta soporte",
      subtitle:
        "Escenarios E06 y E10 · Sin acta de recepción · Regla D4 no evaluada",
      vendor: "Ingeniería y Montajes del Valle S.A.S.",
      nit: "NIT 900654987-2 · DV válido",
      invoice: "FE-1006",
      date: "28 ago 2026 · Periodo en revisión",
      contract: "CT-09 · Vigente",
      order: "OC-1006 ($3.571.429)",
      supportCount: "0",
      confidence: "7 correctas · 1 no evaluada",
      matchTitle: "Falta el acta de recepción del servicio",
      matchSubtitle: "El sistema no inventa soportes ni asume entregas",
      comparisons: [
        {
          icon: "ok",
          symbol: "✓",
          title: "Aritmética e IVA (V1 a V4)",
          detail: "Subtotal $3.571.429 más IVA $678.571 = $4.250.000",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas V1 a V4 · Aritmética e IVA",
          breakdown: [
            { label: "Subtotal base", val: "$3.571.429" },
            { label: "IVA 19 %", val: "$678.571" },
            { label: "Total calculado", val: "$4.250.000", highlight: "ok" },
            { label: "Tolerancia", val: "≤ 1 COP" },
          ],
          note: "Cálculo de impuestos y subtotales coincide exactamente con los valores de la factura.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Proveedor y orden (D1 y D2)",
          detail: "Coincide con el valor autorizado en OC-1006",
          value: "Correcta",
          tone: "ok",
          rules: "Reglas D1 y D2 · Cruce comercial",
          breakdown: [
            { label: "NIT emisor", val: "900654987-2" },
            { label: "Orden compra", val: "OC-1006" },
            { label: "Valor autorizado", val: "$3.571.429" },
            { label: "Diferencia", val: "$0", highlight: "ok" },
          ],
          note: "El valor facturado se ajusta estrictamente al importe autorizado en la orden.",
        },
        {
          icon: "warning",
          symbol: "!",
          title: "Soporte de recepción (Regla D4)",
          detail: "No hay acta adjunta para comprobar la entrega",
          value: "No evaluada",
          tone: "warning",
          rules: "Regla D4 · Soporte de entrega de servicios",
          breakdown: [
            { label: "Acta entrega", val: "Pendiente", highlight: "warning" },
            {
              label: "Firma recibido",
              val: "No registrada",
              highlight: "warning",
            },
            { label: "Estado regla", val: "No evaluada" },
            { label: "Acción", val: "Adjuntar soporte" },
          ],
          note: "Se requiere adjuntar el acta de entrega o informe de conformidad antes de autorizar la causación.",
        },
      ],
      exceptionTitle: "Documento obligatorio faltante (Regla D4)",
      exceptionCopy:
        "La factura y la orden coinciden en valor, pero <strong>falta el soporte de recepción</strong>. El control queda como <strong>no evaluado</strong> hasta que adjuntes el acta firmada.",
      proposalStatus: "En espera de acta",
      proposalPill: "pill--review",
      proposalAccount: "5135 · Montajes / CC-05",
      proposalBase: "$3.571.429",
      proposalDiff: "Falta acta D4",
      secondaryActionType: "attach",
      secondaryAction: "Asociar acta de recepción",
      primaryAction: 'Aprobar propuesta <span aria-hidden="true">→</span>',
      audit:
        "<strong>Historial del caso (FE-1006):</strong> Factura recibida · Orden OC-1006 conciliada · Regla D4 marcada como no evaluada por falta de soporte.",
      timeline: [
        {
          dot: "blue",
          time: "11:00 · Factura recibida y validada en cálculos",
          detail: "Los importes cuadran con la orden de compra OC-1006.",
          tag: "Extraída",
        },
        {
          dot: "amber",
          time: "11:02 · Soporte faltante detectado (Regla D4)",
          detail:
            "Se bloquea la aprobación hasta anexar el acta de recepción conforme.",
          tag: "Sin soporte",
        },
      ],
      docs: {
        invoice: {
          preview: "Factura electrónica (DOC-006)",
          badge: "[SIN SOPORTE · E06]",
          kind: "Representación gráfica · Factura de servicios",
          number: "FE-1006",
          rows: [
            [
              "Servicio de adecuación técnica en planta",
              "1",
              "$3.571.429",
              "$3.571.429",
            ],
            ["IVA 19 % sobre base gravada", "19%", "$3.571.429", "$678.571"],
          ],
          subtotal: "$3.571.429",
          iva: "$678.571",
          total: "$4.250.000",
          footer:
            "Cuando falta un documento obligatorio, el sistema informa qué falta y evita aprobar a ciegas.",
        },
        purchase: {
          preview: "Orden de compra (DOC-OC-1006)",
          badge: "[OC CONCILIADA]",
          kind: "Orden de compra autorizada",
          number: "OC-1006",
          rows: [
            [
              "Adecuación técnica autorizada (exige acta de entrega para pago)",
              "1",
              "$3.571.429",
              "$3.571.429",
            ],
          ],
          subtotal: "$3.571.429",
          iva: "$678.571",
          total: "$4.250.000",
          footer: "La orden exige adjuntar acta de recibido firmada.",
        },
        contract: {
          preview: "Contrato asociado (DOC-CT-09)",
          badge: "[VIGENTE]",
          kind: "Contrato de obra y montaje",
          number: "CT-09",
          rows: [
            [
              "Contrato vigente con cláusula de pago contra acta de entrega",
              "1",
              "$3.571.429",
              "Activo",
            ],
          ],
          subtotal: "$3.571.429",
          iva: "$678.571",
          total: "$4.250.000",
          footer: "Contrato verificado sin alertas.",
        },
        support: {
          preview: "Soportes (Faltante)",
          badge: "[NO ENCONTRADO]",
          kind: "Checklist de documentos requeridos",
          number: "SIN ACTA",
          rows: [
            [
              "Acta de recepción técnica firmada por supervisor",
              "0",
              "Faltante",
              "Obligatorio",
            ],
            [
              "Haz clic en «Asociar acta de recepción» para cargarla al expediente",
              "1",
              "Acción",
              "Pendiente",
            ],
          ],
          subtotal: "Pendiente",
          iva: "Pendiente",
          total: "Pendiente",
          footer:
            "Adjuntar el soporte desbloquea la evaluación de las reglas D4 y D5.",
        },
      },
    },
    "FE-1011": {
      invoiceId: "INV-011",
      status: "ready",
      businessState: "PROPUESTA",
      statusLabel: "Autorizada",
      subtitle:
        "Escenarios E11 y E13 · Excepción autorizada con soporte · Lista para aprobar",
      vendor: "Tecnología y Nube Empresarial S.A.S.",
      nit: "NIT 900789123-1 · DV válido",
      invoice: "FE-1011",
      date: "19 sep 2026 · Periodo abierto",
      contract: "CT-11 · Con adenda",
      order: "OC-1011 ($9.500.000)",
      supportCount: "2",
      confidence: "D2 autorizada · Tol. ≤ $1",
      matchTitle: "Diferencia respaldada con adenda firmada",
      matchSubtitle:
        "El hallazgo original se conserva junto con su autorización",
      comparisons: [
        {
          icon: "ok",
          symbol: "✓",
          title: "Redondeo dentro de tolerancia (E13)",
          detail: "Diferencia de $0,50 cubierta por tolerancia de 1 COP",
          value: "Correcta",
          tone: "ok",
          rules: "Regla V4 / Escenario E13 · Tolerancia de redondeo",
          breakdown: [
            { label: "Diferencia decimal", val: "$0,50 COP" },
            { label: "Tolerancia DIAN", val: "≤ 1,00 COP" },
            { label: "Margen", val: "Válido", highlight: "ok" },
            { label: "Ajuste contable", val: "Centavos redondeados" },
          ],
          note: "La discrepancia de 50 centavos está dentro de la tolerancia paramétrica de 1 peso colombiano.",
        },
        {
          icon: "warning",
          symbol: "!",
          title: "Diferencia original contra OC (D2)",
          detail: "Factura $10 M vs. OC inicial $9,5 M (+$500.000)",
          value: "Detectada",
          tone: "warning",
          rules: "Regla D2 · Excepción comercial original",
          breakdown: [
            { label: "Base OC original", val: "$9.500.000" },
            { label: "Base facturada", val: "$10.000.000" },
            {
              label: "Exceso registrado",
              val: "+$500.000",
              highlight: "warning",
            },
            { label: "Desviación (%)", val: "+5,26 %" },
          ],
          note: "El registro de auditoría conserva la traza histórica del exceso original de COP 500.000.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Autorización registrada (Escenario E11)",
          detail: "Respaldada con documento DOC-AUT-01 y motivo",
          value: "Autorizada",
          tone: "ok",
          rules: "Escenario E11 · Aprobación con excepción",
          breakdown: [
            { label: "Documento adenda", val: "DOC-AUT-01" },
            { label: "Autorizador", val: "Gerencia Operaciones" },
            { label: "Estado excepción", val: "Aprobada", highlight: "ok" },
            { label: "Causación", val: "Habilitada", highlight: "ok" },
          ],
          note: "Excepción comercial debidamente soportada y aprobada por el área responsable.",
        },
      ],
      exceptionTitle: "Excepción comercial resuelta con respaldo (DOC-AUT-01)",
      exceptionCopy:
        "La regla D2 conserva el registro de la diferencia de <strong>COP 500.000</strong>, pero una persona autorizada anexó la adenda <strong>DOC-AUT-01</strong> y justificó continuar.",
      proposalStatus: "Lista con autorización",
      proposalPill: "pill--ready",
      proposalAccount: "5135 · Licencias y nube / CC-04",
      proposalBase: "$10.000.000 (Autorizado)",
      proposalDiff: "$500.000 (Justificada)",
      secondaryActionType: "reject",
      secondaryAction: "Rechazar con motivo",
      primaryAction: 'Aprobar propuesta <span aria-hidden="true">→</span>',
      audit:
        "<strong>Historial del caso (FE-1011):</strong> Diferencia D2 detectada (09:03) · Soporte DOC-AUT-01 anexado (10:15) · Excepción autorizada (10:20) · Propuesta generada (10:21).",
      timeline: [
        {
          dot: "amber",
          time: "09:03 · Diferencia frente a OC inicial detectada",
          detail: "La factura supera la orden inicial en $500.000.",
          tag: "Excepción",
        },
        {
          dot: "green",
          time: "10:15 · Adenda DOC-AUT-01 asociada al expediente",
          detail: "Se adjunta soporte firmado sin borrar el hallazgo original.",
          tag: "Soporte",
        },
        {
          dot: "green",
          time: "10:20 · Excepción comercial autorizada",
          detail:
            "Aprobadora autorizada registra motivo y habilita la propuesta.",
          tag: "Autorizada",
        },
      ],
      docs: {
        invoice: {
          preview: "Factura electrónica (DOC-011)",
          badge: "[AUTORIZADA · E11]",
          kind: "Representación gráfica · Factura con adenda",
          number: "FE-1011",
          rows: [
            [
              "Suscripción anual de infraestructura en la nube",
              "1",
              "$10.000.000",
              "$10.000.000",
            ],
            [
              "Ajuste de redondeo de $0,50 dentro de la tolerancia de 1 COP (E13)",
              "1",
              "$0,50",
              "Tolerancia",
            ],
          ],
          subtotal: "$10.000.000",
          iva: "$1.900.000",
          total: "$11.900.000",
          footer:
            "Muestra por separado la diferencia detectada y la autorización humana que permite continuar.",
        },
        purchase: {
          preview: "Orden de compra inicial (DOC-OC-1011)",
          badge: "[OC INICIAL]",
          kind: "Orden de compra previa a la ampliación",
          number: "OC-1011",
          rows: [
            [
              "Capacidad inicial contratada antes de la adenda",
              "1",
              "$9.500.000",
              "$9.500.000",
            ],
          ],
          subtotal: "$9.500.000",
          iva: "$1.805.000",
          total: "$11.305.000",
          footer: "Se conserva el valor original de la orden para auditoría.",
        },
        contract: {
          preview: "Contrato y adenda (DOC-CT-11)",
          badge: "[CON ADENDA]",
          kind: "Contrato actualizado",
          number: "CT-11",
          rows: [
            [
              "Adenda firmada que amplía el tope a $10.000.000 de subtotal",
              "1",
              "$10.000.000",
              "Vigente",
            ],
          ],
          subtotal: "$10.000.000",
          iva: "$1.900.000",
          total: "$11.900.000",
          footer: "Respaldo contractual verificado.",
        },
        support: {
          preview: "Autorización firmada (DOC-AUT-01)",
          badge: "[SOPORTE VERIFICADO]",
          kind: "Evidencia de autorización humana",
          number: "DOC-AUT-01",
          rows: [
            [
              "Autorización registrada por María Contable: Ajuste de capacidad respaldado",
              "1",
              "Firmado",
              "Válido",
            ],
            [
              "Acta de recepción del servicio en la nube",
              "1",
              "Firmado",
              "Conforme",
            ],
          ],
          subtotal: "$10.000.000",
          iva: "$1.900.000",
          total: "$11.900.000",
          footer: "Decisión auditable vinculada al evento EV-010.",
        },
      },
    },
    "FE-1004": {
      invoiceId: "INV-004",
      status: "processing",
      businessState: "RECHAZADA",
      statusLabel: "Duplicada · Rechazada",
      subtitle: "Escenario E04 · Mismo NIT, prefijo y número ya registrado",
      vendor: "Logística y Transporte Nacional S.A.S.",
      nit: "NIT 900321654 · DV no impreso",
      invoice: "FE-1004",
      date: "12 sep 2026 · Registro repetido",
      contract: "Sin contrato adjunto",
      order: "OC-1004 ($2.000.000)",
      supportCount: "0",
      confidence: "Bloqueo por regla V6",
      matchTitle: "Factura duplicada bloqueada a tiempo",
      matchSubtitle: "Evita causar dos veces la misma obligación",
      comparisons: [
        {
          icon: "warning",
          symbol: "!",
          title: "Control de duplicidad (Regla V6)",
          detail: "Ya existe NIT 900321654 + prefijo FE + número 1004",
          value: "Duplicada",
          tone: "warning",
          rules: "Regla V6 · Integridad y control antiduplicados",
          breakdown: [
            { label: "Clave única", val: "900321654-FE-1004" },
            {
              label: "Coincidencia ERP",
              val: "Encontrada en histórico",
              highlight: "warning",
            },
            { label: "Fecha radicación anterior", val: "04 sep 2026" },
            {
              label: "Veredicto",
              val: "Rechazo automático",
              highlight: "warning",
            },
          ],
          note: "Se bloquea la causación por detección de factura duplicada para prevenir doble desembolso.",
        },
        {
          icon: "warning",
          symbol: "!",
          title: "Dígito de verificación (Regla V5)",
          detail: "No aparece en el documento: no se adivina",
          value: "No evaluado",
          tone: "warning",
          rules: "Regla V5 · Validación NIT DIAN",
          breakdown: [
            { label: "NIT impreso", val: "900321654" },
            { label: "DV impreso", val: "Falta en PDF", highlight: "warning" },
            { label: "Cálculo algorítmico", val: "No sustitutivo" },
            { label: "Estado regla", val: "No evaluada" },
          ],
          note: "El sistema no infiere ni adivina datos faltantes del emisor sin respaldo gráfico.",
        },
        {
          icon: "ok",
          symbol: "✓",
          title: "Factura original protegida",
          detail: "Se rechaza solo este segundo intento de carga",
          value: "Resguardada",
          tone: "ok",
          rules: "Protección de estado contable",
          breakdown: [
            { label: "Expediente previo", val: "Inalterado", highlight: "ok" },
            { label: "Afectación ERP", val: "Ninguna" },
            { label: "Estado contable", val: "Protegido", highlight: "ok" },
          ],
          note: "El rechazo solo aplica al archivo entrante, salvaguardando la integridad de los registros existentes.",
        },
      ],
      exceptionTitle: "Rechazo automático del intento duplicado (Regla V6)",
      exceptionCopy:
        "La combinación de <strong>NIT, prefijo FE y número 1004</strong> ya fue procesada en otro expediente. Se detiene este nuevo intento sin alterar ni borrar el registro original.",
      proposalStatus: "Rechazada (Duplicada)",
      proposalPill: "pill--neutral",
      proposalAccount: "No aplica (Bloqueo V6)",
      proposalBase: "$2.000.000",
      proposalDiff: "Duplicado exacto",
      secondaryActionType: "view_original",
      secondaryAction: "Consultar expediente original",
      primaryAction:
        'Intento duplicado cerrado <span aria-hidden="true">✓</span>',
      audit:
        "<strong>Historial del caso (FE-1004):</strong> Archivo recibido · Clave NIT + FE + 1004 detectada en base de datos · Procesamiento rechazado conservando el original.",
      timeline: [
        {
          dot: "blue",
          time: "14:10 · Nueva carga recibida",
          detail: "Se identifica el archivo DOC-004.",
          tag: "Recibida",
        },
        {
          dot: "amber",
          time: "14:10 · Coincidencia exacta en el historial (Regla V6)",
          detail:
            "Mismo emisor, prefijo FE y número 1004 encontrado en registros previos.",
          tag: "Duplicada",
        },
        {
          dot: "amber",
          time: "14:11 · Segundo procesamiento rechazado",
          detail:
            "Se impide una doble causación y se enlaza al expediente original.",
          tag: "Rechazada",
        },
      ],
      docs: {
        invoice: {
          preview: "Factura duplicada (DOC-004)",
          badge: "[DUPLICADA · V6]",
          kind: "Segundo intento de registro bloqueado",
          number: "FE-1004",
          rows: [
            [
              "Servicio de transporte nacional de mercancía",
              "1",
              "$2.000.000",
              "$2.000.000",
            ],
            ["IVA 19 % declarado", "19%", "$2.000.000", "$380.000"],
          ],
          subtotal: "$2.000.000",
          iva: "$380.000",
          total: "$2.380.000",
          footer:
            "La base de datos impide registrar dos veces la misma clave NIT + prefijo + número.",
        },
        purchase: {
          preview: "Orden de compra (DOC-OC-1004)",
          badge: "[YA UTILIZADA]",
          kind: "Orden vinculada al expediente original",
          number: "OC-1004",
          rows: [
            [
              "Orden ya asociada a la primera carga de FE-1004",
              "1",
              "$2.000.000",
              "$2.000.000",
            ],
          ],
          subtotal: "$2.000.000",
          iva: "$380.000",
          total: "$2.380.000",
          footer:
            "Protege el saldo de la orden de compra contra cobros dobles.",
        },
        contract: {
          preview: "Contrato (No adjunto)",
          badge: "[NO EVALUADO]",
          kind: "Sin contrato asociado",
          number: "N/A",
          rows: [
            ["Operación por orden de compra puntual", "—", "—", "No aplica"],
          ],
          subtotal: "—",
          iva: "—",
          total: "—",
          footer: "Sin datos inventados.",
        },
        support: {
          preview: "Soportes (En expediente original)",
          badge: "[VER ORIGINAL]",
          kind: "Referencia cruzada",
          number: "ORIG-1004",
          rows: [
            [
              "Los soportes descansan en el expediente original de FE-1004",
              "1",
              "Original",
              "Resguardado",
            ],
          ],
          subtotal: "$2.000.000",
          iva: "$380.000",
          total: "$2.380.000",
          footer: "Ningún intento duplicado sobrescribe los soportes previos.",
        },
      },
    },
  };

  let activeCase = null;
  let activeTab = "invoice";
  let activeFilter = "all";
  let activeAuditFilter = "all";
  let auditQuery = "";
  let auditHistoryPage = 1;
  let documentsPage = 1;
  let lmmHistoryFilter = "all";
  let lmmHistoryQuery = "";
  let lmmHistoryPage = 1;
  let activePeriod = "all";
  let activeQueuePage = 1;
  const queuePageSize = 4;
  const auditHistoryPageSize = 8;
  const documentsPageSize = 10;
  const lmmHistoryPageSize = 8;
  let zoomLevel = 100;
  let modalLastFocus;
  let currentActionMode = null;
  let lmmStreamTimer = null;
  let lmmSkeletonTimer = null;

  const apiStatus = (businessStatus) => {
    if (["PROPUESTA", "APROBADA"].includes(businessStatus)) return "ready";
    if (["RECIBIDA", "EXTRAIDA", "VALIDADA"].includes(businessStatus)) return "processing";
    return "review";
  };

  const apiStatusLabel = (businessStatus) => ({
    RECIBIDA: "Recibida",
    EXTRAIDA: "En proceso",
    VALIDADA: "Validada",
    EXCEPCION: "Requiere revisión",
    PROPUESTA: "Con propuesta",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
  })[businessStatus] || "En proceso";

  const BACKEND_STATUS_LABELS = Object.freeze({
    BLOCKED_PENDING_REVIEW: "Bloqueada · Requiere revisión",
    MISSING_DATA: "Datos faltantes",
    MISSING_PERIODS: "Periodos faltantes",
    DIFERENCIA_VS_OC: "Diferencia frente a OC",
    AMOUNT_MISMATCH: "Diferencia de importes",
    INVOICE_RECEIVED: "Factura recibida",
    EXTRACTION_COMPLETED: "Extracción completada",
    VALIDATION_COMPLETED: "Validación completada",
    EXCEPTION_EVALUATED: "Excepción evaluada",
    PROPOSAL_GENERATED: "Propuesta generada",
    passed: "Correcto",
    not_evaluated: "No evaluado",
    pending: "Pendiente",
    failed: "Con observaciones",
    READY_FOR_APPROVAL: "Lista para aprobación",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
    RECIBIDA: "Recibida",
    EXTRAIDA: "Extraída",
    VALIDADA: "Validada",
    EXCEPCION: "Requiere revisión",
    PROPUESTA: "Con propuesta",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
    CLAUDE: "Claude",
    HIGH: "Alto",
    MEDIUM: "Medio",
    LOW: "Bajo",
    CRITICAL: "Crítico",
  });

  const backendStatusLabel = (value) => {
    const raw = String(value ?? "").trim();
    if (BACKEND_STATUS_LABELS[raw]) return BACKEND_STATUS_LABELS[raw];
    if (!raw) return "Sin estado";
    return raw
      .toLowerCase()
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const backendTextLabel = (value) => Object.entries(BACKEND_STATUS_LABELS)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((text, [raw, label]) => {
      // Solo traducir códigos completos. Evita corromper palabras como
      // "EXCEPCIONES" al reemplazar el código "EXCEPCION".
      const tokenPattern = new RegExp(
        `(^|[^A-Za-z0-9_])${escapeRegExp(raw)}(?![A-Za-z0-9_])`,
        "g",
      );
      return text.replace(tokenPattern, (_, prefix) => `${prefix}${label}`);
    }, String(value ?? ""));

  const documentCategoryLabel = (category) => ({
    invoice: "Factura",
    purchase_order: "Orden de compra",
    contract: "Contrato",
    support: "Soporte",
  })[String(category || "").toLowerCase()] || backendStatusLabel(category || "Documento");

  const documentProcessingLabel = (status) => ({
    success: "Procesado",
    partial: "Procesado parcialmente",
    processing: "En procesamiento",
    pending: "Pendiente",
    failed: "Con observaciones",
  })[String(status || "").toLowerCase()] || backendStatusLabel(status || "Estado no reportado");

  const apiTimeline = (events, fallback) => {
    if (!Array.isArray(events) || !events.length) return fallback;
    return events.map((event) => {
      const date = event.occurred_at ? new Date(event.occurred_at) : null;
      const time = date && !Number.isNaN(date.getTime())
        ? date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
        : "--:--";
      const terminal = String(event.to_status || "");
      const dot = ["APROBADA", "VALIDADA", "PROPUESTA"].includes(terminal)
        ? "green"
        : ["EXCEPCION", "RECHAZADA"].includes(terminal) ? "amber" : "blue";
      return {
        dot,
        time: `${time} · ${backendStatusLabel(event.event_type || "Evento registrado")}`,
        detail: backendTextLabel(event.reason || `${event.actor_name || "Sistema"} registró el evento.`),
        tag: backendStatusLabel(event.to_status || event.event_type || "Registrado"),
      };
    });
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const amountText = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? `$${numeric.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`
      : String(value);
  };

  const ratioPercent = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? `${Math.round(Math.max(0, Math.min(1, numeric)) * 100)} %`
      : "No reportado";
  };

  const backendValueText = (text, amount) => {
    if (text !== null && text !== undefined && String(text).trim()) return String(text);
    if (amount !== null && amount !== undefined && amount !== "") return amountText(amount);
    return "No reportado";
  };

  const RULE_DEFINITIONS = Object.freeze({
    V1: {
      title: "Cálculo de cada línea",
      description: "cantidad × precio unitario − descuento",
    },
    V2: {
      title: "Subtotal de la factura",
      description: "suma de líneas contra subtotal",
    },
    V3: {
      title: "Cálculo del IVA",
      description: "base gravable × tarifa contra IVA declarado",
    },
    V4: {
      title: "Total de la factura",
      description: "subtotal + impuestos contra total declarado",
    },
    V5: {
      title: "Dígito de verificación del NIT",
      description: "cálculo matemático del DV del proveedor",
    },
    V6: {
      title: "Control de duplicidad",
      description: "NIT, prefijo y número contra registros existentes",
    },
    V7: {
      title: "Periodo contable",
      description: "fecha de emisión contra periodos abiertos",
    },
    D2: {
      title: "Subtotal frente a la orden de compra",
      description: "subtotal de factura contra subtotal de OC",
    },
  });

  const rulePresentation = (check, occurrence = 1, totalOccurrences = 1) => {
    const code = String(check.rule_id || "—");
    const definition = RULE_DEFINITIONS[code] || {
      title: "Control documental",
      description: "verificación recibida del backend",
    };
    const status = String(check.result || "not_evaluated");
    const reason = backendTextLabel(check.reason || "Datos insuficientes");
    const isNotEvaluated = status === "not_evaluated";
    const hasAmounts = check.expected_amount != null && check.actual_amount != null;
    const expectedAmount = amountText(check.expected_amount);
    const actualAmount = amountText(check.actual_amount);
    const difference = amountText(check.difference);
    const title = totalOccurrences > 1 && ["V1", "V3"].includes(code)
      ? definition.title + " · control " + occurrence
      : definition.title;
    let detail = "";
    let breakdown = [];

    if (code === "V5" && !isNotEvaluated) {
      const expected = check.expected_text || "—";
      const actual = check.actual_text || "—";
      detail = "DV esperado " + expected + " · informado " + actual + (status === "passed" ? " · coincide" : " · no coincide");
      breakdown = [
        { label: "DV calculado", val: expected },
        { label: "DV informado", val: actual, highlight: status === "passed" ? "ok" : "warning" },
      ];
    } else if (code === "V6" && !isNotEvaluated) {
      detail = status === "passed"
        ? "No se encontró otra factura con el mismo NIT, prefijo y número"
        : "Se encontró una coincidencia: " + reason;
      breakdown = [
        { label: "Resultado", val: status === "passed" ? "Sin duplicados" : "Coincidencia detectada", highlight: status === "passed" ? "ok" : "warning" },
        { label: "Criterio", val: definition.description },
      ];
    } else if (code === "V7" && !isNotEvaluated) {
      const issuedDate = check.actual_text ? dateText(check.actual_text) : "fecha no reportada";
      detail = status === "passed"
        ? "Fecha " + issuedDate + " dentro de un periodo contable abierto"
        : "Fecha " + issuedDate + " fuera de un periodo contable abierto";
      breakdown = [
        { label: "Fecha de factura", val: issuedDate },
        { label: "Resultado", val: status === "passed" ? "Periodo abierto" : "Periodo cerrado", highlight: status === "passed" ? "ok" : "warning" },
      ];
    } else if (hasAmounts) {
      const labels = {
        V1: ["Valor calculado", "Valor declarado"],
        V2: ["Suma de líneas", "Subtotal factura"],
        V3: ["IVA calculado", "IVA declarado"],
        V4: ["Subtotal + impuestos", "Total factura"],
        D2: ["Subtotal OC", "Subtotal factura"],
      }[code] || ["Valor esperado", "Valor declarado"];
      const matches = status === "passed";
      const actualLabel = code === "V3" ? "IVA declarado" : labels[1].toLowerCase();
      detail = labels[0] + " " + expectedAmount + " · " + actualLabel + " " + actualAmount + (matches ? " · coincide" : " · diferencia " + difference);
      breakdown = [
        { label: labels[0], val: expectedAmount },
        { label: labels[1], val: actualAmount, highlight: matches ? "ok" : "warning" },
        { label: "Diferencia", val: difference, highlight: matches ? "ok" : "warning" },
      ];
    } else {
      const readableReason = reason.toLowerCase() === "datos insuficientes"
        ? "Faltan datos para verificar " + definition.description
        : reason;
      detail = isNotEvaluated
        ? "No evaluada · " + readableReason
        : readableReason;
      breakdown = [
        { label: "Estado", val: backendStatusLabel(status), highlight: status === "passed" ? "ok" : "warning" },
        { label: "Qué verifica", val: definition.description },
      ];
    }

    return {
      code,
      title,
      detail,
      rules: "Regla " + code + " · " + definition.title,
      breakdown,
      note: detail,
    };
  };

  const dateText = (value) => {
    if (!value) return "Fecha no disponible";
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const invoiceLabel = (invoice, fallback) => invoice?.number
    ? `${invoice.prefix ? `${invoice.prefix}-` : ""}${invoice.number}`
    : fallback;

  const makeDocumentView = (tabKey, invoice, document) => {
    const label = document?.file_name || `Sin ${DOC_META[tabKey]?.title?.toLowerCase() || "documento"} asociado`;
    const lines = tabKey === "invoice" && Array.isArray(invoice.lines)
      ? invoice.lines.map((line) => [
        line.description || "Línea sin descripción",
        line.quantity || "—",
        amountText(line.unit_price),
        amountText(line.amount),
      ])
      : [];
    return {
      preview: label,
      badge: document ? `[${String(document.processing_status || "RECIBIDO").toUpperCase()}]` : "[NO ASOCIADO]",
      kind: document ? (document.available === false ? `Documento ${document.category} registrado, pero el archivo no está disponible en el volumen` : `Documento ${document.category} recibido por el backend`) : "No existe un documento asociado en el expediente",
      number: label,
      rows: lines.length ? lines : [["Sin detalle estructurado disponible", "—", "—", "—"]],
      subtotal: amountText(invoice.subtotal),
      iva: amountText((Number(invoice.total) || 0) - (Number(invoice.subtotal) || 0)),
      total: amountText(invoice.total),
      footer: document
        ? `SHA-256 ${document.sha256 || "no disponible"} · Estado técnico: ${document.processing_status || "no disponible"}${document.available === false ? " · Archivo no disponible para descarga" : ""}`
        : "El backend no reportó este tipo de documento para el expediente.",
    };
  };

  const buildLmmFromCase = (caseData) => {
    const invoice = caseData.invoiceData;
    const proposal = caseData.proposal;
    const explanation = proposal?.explanation || {};
    const checks = caseData.checks || [];
    const rows = checks.map((check) => [
      check.rule_id || "—",
      backendTextLabel(check.expected_text || amountText(check.expected_amount)),
      backendTextLabel(check.actual_text || amountText(check.actual_amount)),
      backendStatusLabel(check.result || "not_evaluated"),
    ]);
    const failed = checks.filter((check) => check.result !== "passed");
    const tone = failed.length ? "warning" : "success";
    const summary = backendTextLabel(explanation.summary || (failed.length
      ? `El expediente ${caseData.invoice} tiene ${failed.length} control(es) que requieren revisión humana.`
      : `El expediente ${caseData.invoice} no presenta excepciones abiertas en las validaciones recibidas.`));
    const rawDetail = backendTextLabel(explanation.details || checks.map((check) => `${check.rule_id}: ${check.reason || backendStatusLabel(check.result)}`).join(" · "));
    const legacyCount = rawDetail.match(/^Se detectaron (\d+) inconsistencia\(s\) técnica\(s\)\./);
    const firstExpected = caseData.exceptions?.[0]?.expected;
    const hasExpected = firstExpected !== null && firstExpected !== undefined
      && !/^(?:n\/a|no reportado)?$/i.test(String(firstExpected).trim());
    const expectedDescription = hasExpected
      ? `El valor esperado registrado para la primera excepción es ${Number.isFinite(Number(firstExpected)) ? `${amountText(firstExpected)} COP` : String(firstExpected)}.`
      : "No se reportó un valor esperado para la primera excepción.";
    const detail = legacyCount
      ? `Se ${Number(legacyCount[1]) === 1 ? "detectó" : "detectaron"} ${legacyCount[1]} ${Number(legacyCount[1]) === 1 ? "inconsistencia técnica" : "inconsistencias técnicas"}. El total facturado es de ${amountText(invoice.total)} COP. ${expectedDescription} El nivel de riesgo es ${backendStatusLabel(String(caseData.risk?.level || "no reportado").toUpperCase()).toLowerCase()}.`
      : rawDetail;
    const legacyRecommendation = "Solicitar revisión documental al área solicitante o nota crédito al proveedor antes de proceder con la causación contable.";
    const rawRecommendation = backendTextLabel(explanation.recommendation || "La decisión final permanece en la revisión humana según el estado de la propuesta.");
    const recommendation = legacyCount && rawRecommendation === legacyRecommendation
      ? "Solicitar al área solicitante los soportes necesarios para revisar las inconsistencias. Si se confirma una diferencia en el valor cobrado, pedir al proveedor la nota crédito correspondiente antes de continuar con la causación contable."
      : rawRecommendation;
    const account = proposal?.accounting_proposal?.account_code || "—";
    const costCenter = proposal?.accounting_proposal?.cost_center_code || "—";
    const proposalValues = proposal?.accounting_proposal || {};
    const risk = caseData.risk || {};
    const checksByRule = new Map(checks.map((check) => [check.rule_id, check]));
    const exceptionItems = (caseData.exceptions || []).map((exception) => {
      const check = checksByRule.get(exception.type) || {};
      return {
        type: backendStatusLabel(exception.type || "Excepción"),
        severity: backendStatusLabel(exception.severity || "Sin severidad"),
        message: exception.message || exception.description || check.reason || "Sin detalle reportado.",
        expected: backendValueText(check.expected_text, check.expected_amount),
        actual: backendValueText(check.actual_text, check.actual_amount),
        difference: backendValueText(null, check.difference),
        status: backendStatusLabel(exception.resolution_status || (exception.requires_review ? "OPEN" : "Sin estado")),
      };
    });
    const contextSubtitle = [
      caseData.vendor ? `Proveedor: ${caseData.vendor}` : "",
      caseData.order && caseData.order !== "Orden no asociada" ? `Orden: ${caseData.order}` : "",
      caseData.contract && caseData.contract !== "Contrato no asociado" ? `Contrato: ${caseData.contract}` : "",
    ].filter(Boolean).join(" · ") || "Contexto del expediente recibido desde el backend";
    const findingSummary = exceptionItems.length
      ? `Se ${exceptionItems.length === 1 ? "detectó" : "detectaron"} ${exceptionItems.length} ${exceptionItems.length === 1 ? "hallazgo" : "hallazgos"} que requieren revisión: ${exceptionItems.map((item) => `${item.type} (${item.severity})`).join(" · ")}.`
      : failed.length
        ? `Se ${failed.length === 1 ? "detectó" : "detectaron"} ${failed.length} ${failed.length === 1 ? "control pendiente" : "controles pendientes"} de revisión humana.`
        : "No se detectaron excepciones abiertas en las validaciones recibidas.";
    return {
      execId: `EXPEDIENTE ${caseData.invoiceId}`,
      sources: caseData.apiDocuments.length
        ? caseData.apiDocuments.map((doc) => doc.file_name).join(" · ")
        : "Sin documentos asociados",
      kicker: `DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · ${backendStatusLabel(proposal?.generated_by || "SIN PROPUESTA")}`,
      title: `Respuesta estructurada para ${caseData.invoice}`,
      subtitle: contextSubtitle,
      stampState: caseData.statusLabel.toUpperCase(),
      stampConf: `${checks.filter((check) => check.result === "passed").length} controles OK · ${failed.length} alertas`,
      summaryTone: tone,
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy: escapeHtml(summary),
      triggerLabel: "Abrir respuesta estructurada del backend",
      readyTitle: `RESPUESTA ${proposal?.generated_by === "CLAUDE" ? "DE CLAUDE" : "DEL MOTOR"}`,
      readySub: proposal ? `Generada por ${backendStatusLabel(proposal.generated_by)} · ${caseData.invoice}` : "Propuesta aún no disponible",
      streamSteps: [
        `Backend · Consultando expediente ${caseData.invoice}...`,
        `Etapas 4 a 6 · Leyendo reglas, riesgo y propuesta...`,
        "Respuesta estructurada lista para revisión.",
      ],
      kpis: [
        { label: "Subtotal de la factura", val: amountText(invoice.subtotal), sub: `Total: ${amountText(invoice.total)}` },
        { label: "Controles de validación", val: `${checks.length}`, sub: `${failed.length} requieren atención` },
        { label: "Propuesta contable", val: `${account} / ${costCenter}`, sub: proposal?.accounting_proposal?.status ? backendStatusLabel(proposal.accounting_proposal.status) : "Sin propuesta" },
      ],
      tableCaption: "Resultado de reglas deterministas recibido desde Etapa 4",
      rows,
      blocks: [
        { title: "Hallazgos de la revisión", copy: escapeHtml(findingSummary) },
        ...(detail ? [{ title: "Detalle técnico de la validación", copy: escapeHtml(detail) }] : []),
        { title: "Recomendación", copy: escapeHtml(recommendation) },
      ],
      operational: {
        risk: {
          level: backendStatusLabel(String(risk.level || "").toUpperCase()),
          score: ratioPercent(risk.score),
          scoreValue: Number.isFinite(Number(risk.score)) ? Math.round(Math.max(0, Math.min(1, Number(risk.score))) * 100) : 0,
          confidence: ratioPercent(risk.confidence),
          confidenceValue: Number.isFinite(Number(risk.confidence)) ? Math.round(Math.max(0, Math.min(1, Number(risk.confidence))) * 100) : 0,
          tone: ["HIGH", "CRITICAL"].includes(String(risk.level || "").toUpperCase()) ? "warning" : "success",
        },
        proposal: {
          status: proposalValues.status ? backendStatusLabel(proposalValues.status) : "Sin propuesta",
          account: proposalValues.account_code || "—",
          costCenter: proposalValues.cost_center_code || "—",
          subtotal: amountText(proposalValues.subtotal),
          tax: amountText(proposalValues.tax_total),
          total: amountText(proposalValues.total),
          tone: ["READY_FOR_APPROVAL", "APPROVED"].includes(proposalValues.status) ? "success" : "warning",
        },
        exceptions: exceptionItems,
      },
      plainText: `${summary}\n\n${detail}\n\n${recommendation}`,
      hash: `Documento principal: ${caseData.invoiceData.file_name || "no disponible"}`,
    };
  };

  const makeCaseFromApi = (caseId, payload) => {
    const invoice = payload?.invoice;
    if (!invoice) return null;
    const checks = Array.isArray(payload.validation?.checks) ? payload.validation.checks : [];
    const exceptions = Array.isArray(payload.validation?.exceptions) ? payload.validation.exceptions : [];
    const documents = Array.isArray(payload.documents) ? payload.documents : [];
    const proposal = payload.proposal || null;
    const proposalData = proposal?.accounting_proposal || null;
    const fileStem = String(invoice.file_name || "").replace(/\.pdf$/i, "");
    const fileLabel = fileStem.split("_")[0] || caseId;
    const label = invoiceLabel(invoice, fileLabel);
    const status = apiStatus(invoice.business_status);
    const failedChecks = checks.filter((check) => check.result !== "passed");
    const firstIssue = failedChecks[0] || exceptions[0];
    const documentByCategory = Object.fromEntries(documents.map((doc) => [doc.category, doc]));
    const data = {
      invoiceId: invoice.invoice_id,
      invoice: label,
      invoiceData: invoice,
      status,
      businessState: invoice.business_status,
      statusLabel: apiStatusLabel(invoice.business_status),
      subtitle: `${invoice.file_name || "Factura"} · ${apiStatusLabel(invoice.business_status)}`,
      vendor: invoice.supplier_name || "Proveedor no identificado",
      nit: invoice.supplier_nit_base ? `NIT ${invoice.supplier_nit_base}${invoice.supplier_dv ? `-${invoice.supplier_dv}` : ""}` : "NIT no reportado",
      date: dateText(invoice.issue_date),
      contract: payload.matching?.contract?.contract_number || "Contrato no asociado",
      order: payload.matching?.purchase_order?.order_number || invoice.po_reference || "Orden no asociada",
      supportCount: String(documents.filter((doc) => doc.category === "support").length),
      confidence: invoice.extraction_confidence == null ? `Confianza no reportada · Riesgo ${payload.risk?.level || "no reportado"}` : `Confianza ${(invoice.extraction_confidence * 100).toFixed(1)} % · Riesgo ${payload.risk?.level || "no reportado"}`,
      checks,
      exceptions,
      matching: payload.matching || {},
      risk: payload.risk || {},
      proposal,
      apiDocuments: documents,
      documentUrls: Object.fromEntries(documents.map((doc) => {
        const tabKey = Object.entries(API_CATEGORY_BY_TAB).find(([, category]) => category === doc.category)?.[0];
        return [tabKey || doc.category, doc.available === false ? null : window.NepxaApi?.getDocumentUrl(invoice.invoice_id, doc.document_id)];
      })),
      timeline: apiTimeline(payload.timeline, []),
      docs: Object.fromEntries(DOC_KEYS.map((tabKey) => [tabKey, makeDocumentView(tabKey, invoice, documentByCategory[API_CATEGORY_BY_TAB[tabKey]])])),
      comparisons: checks.length ? checks.map((check, index) => ({
        icon: check.result === "passed" ? "ok" : "warning",
        symbol: check.result === "passed" ? "✓" : "!",
        ...rulePresentation(
          check,
          checks.slice(0, index + 1).filter((item) => item.rule_id === check.rule_id).length,
          checks.filter((item) => item.rule_id === check.rule_id).length,
        ),
        value: backendStatusLabel(check.result),
        tone: check.result === "passed" ? "ok" : "warning",
      })) : [{ icon: "warning", symbol: "!", title: "Validación pendiente", detail: "El backend aún no reporta controles para esta etapa.", value: backendStatusLabel("not_evaluated"), tone: "warning", rules: "Backend", breakdown: [], note: "No se muestran valores inventados." }],
      matchTitle: payload.matching?.matching_status ? `Cruce documental: ${payload.matching.matching_status}` : "Cruce documental no reportado",
      matchSubtitle: firstIssue?.message || firstIssue?.reason || "Resultado de asociación recibido desde el backend.",
      exceptionTitle: exceptions.length ? `${exceptions.length} excepción(es) reportada(s) por el backend` : "Sin excepciones abiertas reportadas",
      exceptionCopy: exceptions.length ? exceptions.map((item) => escapeHtml(item.message || item.type || "Excepción sin detalle")).join(" · ") : "El backend no reporta excepciones abiertas para este expediente.",
      proposalStatus: proposalData ? backendStatusLabel(proposalData.status) : "Sin propuesta",
      proposalPill: ["READY_FOR_APPROVAL", "APPROVED"].includes(proposalData?.status) ? "pill--ready" : "pill--review",
      proposalAccount: proposalData ? `${proposalData.account_code || "—"} · ${proposalData.cost_center_code || "—"}` : "—",
      proposalBase: proposalData ? amountText(proposalData.subtotal) : "—",
      proposalDiff: firstIssue?.difference ? `Diferencia ${amountText(firstIssue.difference)}` : "Sin diferencia reportada",
      secondaryActionType: invoice.business_status === "EXCEPCION" ? (failedChecks.some((check) => check.rule_id === "V4") ? "correct" : "authorize") : "authorize",
      secondaryAction: invoice.business_status === "EXCEPCION" ? "Resolver hallazgo con respaldo" : "Solicitar revisión",
      primaryAction: invoice.business_status === "APROBADA" ? "Propuesta aprobada ✓" : invoice.business_status === "RECHAZADA" ? "Propuesta rechazada" : "Aprobar propuesta →",
      audit: "",
    };
    data.audit = `<strong>Historial del caso (${escapeHtml(label)}):</strong> ${escapeHtml(data.timeline.map((item) => item.tag).join(" · ") || "Sin eventos reportados")}`;
    data.lmm = buildLmmFromCase(data);
    return data;
  };

  const hydrateCaseFromApi = (caseId, payload) => {
    const hydrated = makeCaseFromApi(caseId, payload);
    if (!hydrated) return;
    cases[caseId] = hydrated;
    lmmResponses[caseId] = hydrated.lmm;
  };

  const renderBackendQueue = () => {
    const list = $("[data-queue-list]");
    if (!list) return;
    list.innerHTML = Object.entries(cases).map(([caseId, data]) => `
      <button class="queue-row" type="button" data-case="${escapeHtml(caseId)}" data-status="${escapeHtml(data.status)}" data-period="${escapeHtml(data.invoiceData.issue_date?.slice(0, 7) || "all")}" data-search="${escapeHtml(`${caseId} ${data.vendor} ${data.statusLabel}`.toLowerCase())}">
        <span class="queue-row__status status ${statusClass(data.status)}"></span>
        <span class="queue-row__main"><strong>${escapeHtml(data.invoice)} · ${escapeHtml(data.statusLabel)}</strong><span>${escapeHtml(data.vendor)}</span><small>${escapeHtml(data.subtitle)}</small></span>
        <span class="queue-row__meta"><span class="pill ${data.status === "ready" ? "pill--ready" : data.status === "processing" ? "pill--neutral" : "pill--review"}">${escapeHtml(data.statusLabel)}</span><small class="queue-row__amount">${escapeHtml(amountText(data.invoiceData.total))}</small></span>
      </button>
    `).join("") || `<div class="empty-filter"><strong>No hay expedientes en el backend.</strong><span>Registra una factura para iniciar el proceso por etapas.</span></div>`;
    $$("[data-queue-list] .queue-row").forEach((row) => row.addEventListener("click", () => setActiveCase(row.dataset.case)));
  };

  const renderBackendDocuments = () => {
    const list = $("[data-documents-list]");
    if (!list) return;
    const header = $(".doc-table__head", list);
    list.innerHTML = "";
    if (header) list.appendChild(header);
    const rows = Object.entries(cases).flatMap(([caseId, data]) => data.apiDocuments.map((document) => `
      <div class="doc-table__row">
        <strong>${escapeHtml(data.invoice)}</strong>
        <span>${escapeHtml(document.file_name)}</span>
        <span>${escapeHtml(`${documentCategoryLabel(document.category)} · ${document.available === false ? "Archivo no disponible" : documentProcessingLabel(document.processing_status)}`)}</span>
        <span class="pill ${data.status === "ready" ? "pill--ready" : data.status === "review" ? "pill--review" : "pill--neutral"}">${escapeHtml(data.statusLabel)}</span>
        <button class="text-button table-open-btn" type="button" data-open-case="${escapeHtml(caseId)}" aria-label="Visualizar expediente ${escapeHtml(data.invoice)}">Abrir →</button>
      </div>
    `));
    const pagination = $("[data-documents-pagination]");
    if (!rows.length) {
      list.insertAdjacentHTML("beforeend", `<div class="doc-table__row"><span>No hay documentos devueltos por el backend.</span></div>`);
      if (pagination) pagination.hidden = true;
      return;
    }
    const pageCount = Math.max(1, Math.ceil(rows.length / documentsPageSize));
    documentsPage = Math.min(Math.max(1, documentsPage), pageCount);
    const pageStart = (documentsPage - 1) * documentsPageSize;
    list.insertAdjacentHTML("beforeend", rows.slice(pageStart, pageStart + documentsPageSize).join(""));
    if (pagination) {
      pagination.hidden = rows.length <= documentsPageSize;
      const status = $("[data-documents-page-status]");
      if (status) status.textContent = `Página ${documentsPage} de ${pageCount} · ${rows.length} documentos`;
      const previous = $("[data-documents-page-prev]");
      const next = $("[data-documents-page-next]");
      if (previous) previous.disabled = documentsPage <= 1;
      if (next) next.disabled = documentsPage >= pageCount;
    }
    $$('[data-open-case]', list).forEach((button) => button.addEventListener("click", () => {
      setActiveCase(button.dataset.openCase);
      changeView("revisiones");
    }));
  };

  const renderBackendLmmHistory = () => {
    const list = $("[data-lmm-history-list]");
    if (!list) return;
    const generatedCases = Object.entries(cases).filter(([, data]) => data.proposal);
    const filteredCases = generatedCases.filter(([caseId, data]) => {
      const category = data.checks.some((check) => check.rule_id?.startsWith("D")) ? "oc" : "math";
      const hasSupport = data.apiDocuments.some((document) => document.category === "support")
        || data.checks.some((check) => /support|soporte|acta/i.test(`${check.rule_id || ""} ${check.reason || ""}`));
      const matchesCategory = lmmHistoryFilter === "all"
        || category === lmmHistoryFilter
        || (lmmHistoryFilter === "support" && hasSupport);
      const haystack = `${caseId} ${data.invoice} ${data.vendor} ${data.statusLabel} ${data.proposal?.generated_by || ""} ${data.lmm?.readySub || ""}`.toLowerCase();
      return matchesCategory && (!lmmHistoryQuery || haystack.includes(lmmHistoryQuery));
    });
    const pageCount = Math.max(1, Math.ceil(filteredCases.length / lmmHistoryPageSize));
    lmmHistoryPage = Math.min(Math.max(1, lmmHistoryPage), pageCount);
    const pageStart = (lmmHistoryPage - 1) * lmmHistoryPageSize;
    const visibleCases = filteredCases.slice(pageStart, pageStart + lmmHistoryPageSize);
    list.innerHTML = visibleCases.map(([caseId, data]) => `
      <button class="lmm-history-item" type="button" data-lmm-case="${escapeHtml(caseId)}" data-lmm-cat="${data.checks.some((check) => check.rule_id?.startsWith("D")) ? "oc" : "math"}">
        <span class="lmm-history-item__icon activity-badge ${data.status === "ready" ? "activity-badge--green" : "activity-badge--amber"}">AI</span>
        <span class="lmm-history-item__main"><strong>${escapeHtml(data.invoice)}</strong><small>${escapeHtml(data.vendor)}</small><span>${escapeHtml(data.lmm.readySub)}</span></span>
        <span class="lmm-history-item__meta"><b>${escapeHtml(backendStatusLabel(data.proposal?.generated_by || "SIN PROPUESTA"))}</b><small>${escapeHtml(data.statusLabel)}</small></span>
      </button>
    `).join("") || `<div class="empty-filter"><strong>No hay respuestas que coincidan.</strong><span>Ajusta la búsqueda o cambia el filtro para consultar las propuestas persistidas.</span></div>`;
    $$('[data-lmm-case]', list).forEach((button) => button.addEventListener("click", () => {
      setActiveCase(button.dataset.lmmCase);
      renderLmmViewer(button.dataset.lmmCase, true);
    }));
    $$('[data-lmm-filter]').forEach((chip) => chip.classList.toggle("is-active", chip.dataset.lmmFilter === lmmHistoryFilter));
    const pagination = $("[data-lmm-pagination]");
    if (pagination) {
      pagination.hidden = filteredCases.length <= lmmHistoryPageSize;
      const status = $("[data-lmm-page-status]");
      if (status) status.textContent = `Página ${lmmHistoryPage} de ${pageCount} · ${filteredCases.length} respuestas`;
      const previous = $("[data-lmm-page-prev]");
      const next = $("[data-lmm-page-next]");
      if (previous) previous.disabled = lmmHistoryPage <= 1;
      if (next) next.disabled = lmmHistoryPage >= pageCount;
    }
  };

  const renderBackendTreeCases = () => {
    const list = $("[data-tree-case-list]");
    if (!list) return;
    list.innerHTML = Object.entries(cases).map(([caseId, data]) => `<button class="tree-case-pill${caseId === activeCase ? " is-active" : ""}" type="button" data-tree-select="${escapeHtml(caseId)}">${escapeHtml(data.invoice)}</button>`).join("");
    $$('[data-tree-select]', list).forEach((button) => button.addEventListener("click", () => {
      if (cases[button.dataset.treeSelect]) setActiveCase(button.dataset.treeSelect);
    }));
  };

  const renderBackendRules = (caseId) => {
    const list = $("[data-rule-live-list]");
    const current = cases[caseId];
    if (!list || !current) return;
    const staticGroups = $(".rules-groups-grid", $('[data-route-view="reglas"]'));
    if (!staticGroups) return;

    const ruleGroups = [
      {
        title: "Exactitud en importes e IVA",
        subtitle: "Comprobación aritmética de la factura",
        icon: "AI_Invoice_Processor_Enterprise_Identity_v1/06_UI_Icons/SVG/icon-process-navy.svg",
        tone: "blue",
        ruleIds: ["V1", "V2", "V3", "V4"],
      },
      {
        title: "Identidad y control de duplicados",
        subtitle: "Validación del emisor y del periodo",
        icon: "AI_Invoice_Processor_Enterprise_Identity_v1/06_UI_Icons/SVG/icon-audit-navy.svg",
        tone: "navy",
        ruleIds: ["V5", "V6", "V7"],
      },
      {
        title: "Orden de compra y soportes",
        subtitle: "Conciliación comercial del expediente",
        icon: "AI_Invoice_Processor_Enterprise_Identity_v1/06_UI_Icons/SVG/icon-compare-navy.svg",
        tone: "green",
        ruleIds: ["D1", "D2", "D3", "D4", "D5"],
      },
    ];

    const routeRuleTitles = {
      V1: "Importe exacto por cada línea",
      V2: "Suma íntegra del subtotal",
      V3: "Cálculo del IVA",
      V4: "Total de la factura",
      V5: "NIT y dígito de verificación",
      V6: "Prevención de facturas repetidas",
      V7: "Fecha de emisión y mes contable",
      D2: "Tope de orden de compra y contrato",
    };

    const renderRuleItem = (check, occurrence, totalOccurrences) => {
      const presentation = rulePresentation(check, occurrence, totalOccurrences);
      const passed = check.result === "passed";
      const title = routeRuleTitles[String(check.rule_id || "")] || presentation.title;
      return `<div class="rule-point-item" data-rule-result="${escapeHtml(check.result || "not_evaluated")}">
        <span class="rule-point-dot ${passed ? "rule-point-dot--green" : "rule-point-dot--amber"}" aria-hidden="true"></span>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(presentation.detail)}</small>
        </div>
        <span class="pill ${passed ? "pill--ready" : "pill--review"}">${escapeHtml(backendStatusLabel(check.result || "not_evaluated"))}</span>
      </div>`;
    };

    staticGroups.innerHTML = ruleGroups.map((group) => {
      const checks = current.checks.filter((check) => group.ruleIds.includes(String(check.rule_id || "")));
      const occurrences = {};
      const items = checks.map((check) => {
        const code = String(check.rule_id || "");
        occurrences[code] = (occurrences[code] || 0) + 1;
        const totalOccurrences = current.checks.filter((item) => String(item.rule_id || "") === code).length;
        return renderRuleItem(check, occurrences[code], totalOccurrences);
      }).join("");
      const empty = `<div class="rules-empty-state"><strong>Sin controles reportados</strong><span>El backend no devolvió verificaciones de este bloque para ${escapeHtml(current.invoice)}.</span></div>`;
      return `<article class="rule-group-card">
        <div class="rule-group-card__head">
          <span class="activity-badge activity-badge--${group.tone}"><img src="${group.icon}" alt="" /></span>
          <div><h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.subtitle)}</p></div>
        </div>
        <div class="rule-points-list">${items || empty}</div>
      </article>`;
    }).join("");

    staticGroups.hidden = false;
    list.hidden = true;
    list.setAttribute("aria-hidden", "true");
    list.innerHTML = "";
  };

  const clearBackendViews = () => {
    Object.keys(cases).forEach((key) => delete cases[key]);
    Object.keys(lmmResponses).forEach((key) => delete lmmResponses[key]);
    documentsPage = 1;
    const queue = $("[data-queue-list]");
    if (queue) queue.innerHTML = `<div class="empty-filter"><strong>Conectando con el backend…</strong><span>Preparando los expedientes del proceso por etapas.</span></div>`;
    const documents = $("[data-documents-list]");
    if (documents) {
      const header = $(".doc-table__head", documents);
      documents.innerHTML = "";
      if (header) documents.appendChild(header);
      documents.insertAdjacentHTML("beforeend", `<div class="doc-table__row"><span>Conectando con el repositorio documental…</span></div>`);
    }
    const documentsPagination = $("[data-documents-pagination]");
    if (documentsPagination) documentsPagination.hidden = true;
    const lmmList = $("[data-lmm-history-list]");
    if (lmmList) lmmList.innerHTML = `<div class="empty-filter"><strong>Conectando con las respuestas estructuradas…</strong></div>`;
  };

  const finishWorkspaceTransition = () => {
    const routeSpinner = $("[data-route-spinner]");
    routeSpinner?.classList.remove("is-active");
    const animatedRoutes = $$(".route-reveal");
    if (canAnimate && animatedRoutes.length) {
      window.gsap.killTweensOf(animatedRoutes);
      window.gsap.set(animatedRoutes, { clearProps: "all" });
    } else {
      animatedRoutes.forEach((element) => {
        element.style.removeProperty("opacity");
        element.style.removeProperty("visibility");
        element.style.removeProperty("transform");
      });
    }
  };

  const hydrateWorkspaceFromApi = async () => {
    if (!window.NepxaApi) return;
    clearBackendViews();
    const response = await window.NepxaApi.listCases({ limit: 100 });
    const entries = await Promise.all((response.items || []).map(async (item) => {
      const fileStem = String(item.file_name || "").replace(/\.pdf$/i, "");
      const caseId = fileStem || item.invoice_number || item.invoice_id;
      try {
        const detail = await window.NepxaApi.getCase(item.invoice_id);
        return [caseId, detail];
      } catch (error) {
        console.warn(`[ai-invoice-processor] No se pudo cargar ${caseId}`, error);
        return null;
      }
    }));
    entries.filter(Boolean).forEach(([caseId, detail]) => hydrateCaseFromApi(caseId, detail));
    renderBackendQueue();
    renderBackendDocuments();
    renderBackendLmmHistory();
    const firstCase = Object.keys(cases)[0];
    activeCase = firstCase || null;
    renderBackendTreeCases();
    if (activeCase) {
      setActiveCase(activeCase);
      renderBackendRules(activeCase);
    }
    applyQueueFilters();
    const summary = await window.NepxaApi.getSummary();
    hydrateSummaryFromApi(summary);
    finishWorkspaceTransition();
  };

  const hydrateInventoryFromBackend = (summary) => {
    const title = $("[data-inventory-title]");
    const copy = $("[data-inventory-copy]");
    if (!title || !copy) return;

    const uniqueDocumentCount = (category) => {
      const keys = new Set();
      Object.values(cases).forEach((data) => {
        data.apiDocuments
          .filter((document) => document.category === category)
          .forEach((document) => keys.add(document.document_id || document.file_name));
      });
      return keys.size;
    };
    const uniqueValueCount = (readValue) => {
      const values = new Set();
      Object.values(cases).forEach((data) => {
        const value = readValue(data);
        if (value) values.add(String(value));
      });
      return values.size;
    };
    const formatCount = (value) => Number(value || 0).toLocaleString("es-CO");
    const totalDocuments = Number.isFinite(Number(summary?.files))
      ? Number(summary.files)
      : Object.values(cases).reduce((total, data) => total + data.apiDocuments.length, 0);
    const suppliers = uniqueValueCount((data) => data.matching?.supplier?.supplier_id || data.invoiceData?.supplier_nit_base);
    const contracts = uniqueDocumentCount("contract") || uniqueValueCount((data) => data.matching?.contract?.contract_id);
    const purchaseOrders = uniqueDocumentCount("purchase_order") || uniqueValueCount((data) => data.matching?.purchase_order?.purchase_order_id);
    const invoices = uniqueDocumentCount("invoice") || Object.keys(cases).length;
    const supports = uniqueDocumentCount("support");
    const accounts = uniqueValueCount((data) => data.proposal?.accounting_proposal?.account_code);
    const costCenters = uniqueValueCount((data) => data.proposal?.accounting_proposal?.cost_center_code);

    title.textContent = `${formatCount(totalDocuments)} documentos del conjunto ZIP`;
    copy.textContent = `Incluye ${formatCount(suppliers)} proveedores con NIT y DV, ${formatCount(contracts)} contratos, ${formatCount(purchaseOrders)} órdenes de compra, ${formatCount(invoices)} facturas, ${formatCount(supports)} soportes, ${formatCount(accounts)} cuentas utilizadas y ${formatCount(costCenters)} centros de costo utilizados.`;
  };

  const hydrateSummaryFromApi = (summary) => {
    if (!summary) return;
    const metricMap = {
      total: "data-metric-total",
      review: "data-metric-review",
      ready: "data-metric-ready",
      files: "data-metric-files",
    };
    Object.entries(metricMap).forEach(([key, attribute]) => {
      const node = $(`[${attribute}]`);
      if (node && summary[key] !== undefined) node.textContent = summary[key];
    });
    if ($("[data-nav-docs-count]")) $("[data-nav-docs-count]").textContent = summary.files ?? 0;
    if ($("[data-nav-review-count]")) $("[data-nav-review-count]").textContent = summary.review ?? 0;
    if ($("[data-nav-lmm-count]")) $("[data-nav-lmm-count]").textContent = Object.values(cases).filter((item) => item.proposal).length;
    hydrateInventoryFromBackend(summary);
    const totalCases = Number(summary.total || 0);
    const processingCases = Number(summary.processing || 0);
    const auditedPercentage = totalCases
      ? Math.round(((totalCases - processingCases) / totalCases) * 100)
      : 0;
    if ($("[data-findings-title]")) $("[data-findings-title]").textContent = `Hallazgos en las ${totalCases} facturas`;
    if ($("[data-audited-badge]")) $("[data-audited-badge]").innerHTML = `<span></span> ${auditedPercentage} % auditadas`;
    const findings = Array.isArray(summary.findings) ? summary.findings : [];
    const findingTotal = Math.max(1, findings.reduce((total, finding) => total + Number(finding.count || 0), 0));
    const findingList = $("[data-finding-list]");
    if (findingList) {
      findingList.innerHTML = findings.map((finding) => {
        const percentage = Math.round((Number(finding.count) / findingTotal) * 100);
        return `<div class="finding-item"><span class="activity-badge activity-badge--amber">!</span><span class="finding-item__body"><span class="finding-item__top"><strong>${escapeHtml(backendStatusLabel(finding.type))}</strong><span class="pill pill--review">Backend</span></span><span class="finding-item__progress-row"><span class="finding-bar finding-bar--amber"><i data-bar-width="${percentage}%" style="width:${percentage}%"></i></span><span class="finding-stat"><span class="finding-count">${finding.count} facturas</span><strong class="finding-pct">${percentage} %</strong></span></span></span></div>`;
      }).join("") || `<div class="empty-filter"><strong>No hay hallazgos reportados.</strong><span>La distribución se actualiza con las excepciones persistidas.</span></div>`;
    }
    const monthly = Array.isArray(summary.monthly) ? summary.monthly : [];
    const maxAmount = Math.max(1, ...monthly.flatMap((item) => [Number(item.invoiced), Number(item.ordered)]));
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    if ($("[data-summary-period]") && monthly.length) {
      const firstMonth = monthNames[monthly[0].month - 1] || "";
      const lastMonth = monthNames[monthly[monthly.length - 1].month - 1] || "";
      $("[data-summary-period]").textContent = `${firstMonth} a ${lastMonth} 2026`;
    }
    $$('[data-bar-month]').forEach((button) => {
      button.dataset.inv = "$0";
      button.dataset.oc = "$0";
      button.dataset.diff = "Sin datos reportados";
      delete button.dataset.caseRef;
      button.querySelectorAll(".bar-pill").forEach((bar) => { bar.style.height = "5%"; });
    });
    monthly.forEach((item) => {
      const button = $(`[data-bar-month="${monthNames[item.month - 1]}"]`);
      if (!button) return;
      const invoiceValue = Number(item.invoiced);
      const orderedValue = Number(item.ordered);
      const difference = invoiceValue - orderedValue;
      const differencePercent = orderedValue
        ? ` (${difference >= 0 ? "+" : ""}${((difference / orderedValue) * 100).toFixed(2).replace(".", ",")} %)`
        : "";
      const invoiceHeight = `${Math.max(5, Math.round((invoiceValue / maxAmount) * 100))}%`;
      const orderHeight = `${Math.max(5, Math.round((orderedValue / maxAmount) * 100))}%`;
      button.dataset.inv = `$${invoiceValue.toLocaleString("es-CO")}`;
      button.dataset.oc = `$${orderedValue.toLocaleString("es-CO")}`;
      button.dataset.diff = `${difference >= 0 ? "+" : ""}${amountText(difference)}${differencePercent} · Backend`;
      const bars = $$(".bar-pill", button);
      if (bars[0]) bars[0].style.height = invoiceHeight;
      if (bars[1]) bars[1].style.height = orderHeight;
    });
    const selectedMonth = monthly[monthly.length - 1];
    const selectedButton = selectedMonth
      ? $(`[data-bar-month="${monthNames[selectedMonth.month - 1]}"]`)
      : null;
    if (selectedButton) {
      $$('[data-bar-month]').forEach((button) => button.classList.toggle("is-selected", button === selectedButton));
      const callout = $('[data-bar-callout]');
      if (callout) {
        callout.textContent = selectedButton.dataset.inv || "";
        selectedButton.prepend(callout);
      }
      if ($('[data-bar-month-label]')) $('[data-bar-month-label]').textContent = `${selectedButton.dataset.barMonth} 2026`;
      if ($('[data-bar-invoice-val]')) $('[data-bar-invoice-val]').textContent = `${selectedButton.dataset.inv} facturados`;
      if ($('[data-bar-order-val]')) $('[data-bar-order-val]').textContent = `${selectedButton.dataset.oc} en orden`;
      if ($('[data-bar-diff-val]')) {
        const diff = $('[data-bar-diff-val]');
        diff.textContent = selectedButton.dataset.diff || "";
        diff.classList.toggle("text-warning", (selectedButton.dataset.diff || "").includes("+"));
      }
    }
  };

  const loadLmmFromApi = async (caseId) => {
    const current = cases[caseId];
    if (!window.NepxaApi || !current || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(current.invoiceId || "")) return;
    const detail = await window.NepxaApi.getCase(current.invoiceId);
    hydrateCaseFromApi(caseId, detail);
    renderBackendLmmHistory();
    setActiveCase(caseId);
  };

  const lmmResponses = {
    "FE-9001": {
      execId: "ID #CLOUD-LMM-9001",
      sources:
        "DOC-001.pdf (pág. 1) · DOC-OC-9001.pdf (pág. 1) · DOC-CT-01.pdf",
      kicker: "DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · REGLA D2",
      title:
        "Comparación comercial entre Factura FE-9001 y Orden de Compra OC-9001",
      subtitle:
        "Respuesta generada en Cloud para el analista financiero · Precisión decimal exacta en COP",
      stampState: "EXCEPCIÓN D2 (+4,00 %)",
      stampConf: "7 reglas OK · 1 diferencia",
      summaryTone: "warning",
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy:
        'La factura <span class="lmm-tag">FE-9001</span> cumple todas las validaciones aritméticas e impositivas internas, pero su subtotal antes de impuestos (<span class="lmm-num">COP 52.000.000</span>) supera en <span class="lmm-num">+COP 2.000.000 (+4,00 %)</span> el valor autorizado en la Orden de Compra <span class="lmm-tag">OC-9001</span> (<span class="lmm-num">COP 50.000.000</span>). La comparación se realiza estrictamente subtotal contra subtotal para no distorsionar la base con IVA ni retenciones. La causación en la cuenta <span class="lmm-tag">5135</span> queda bloqueada hasta adjuntar soporte de autorización (<span class="lmm-tag">DOC-AUT-01</span>) o nota crédito.',
      triggerLabel: "Comparar con la Orden de Compra",
      readyTitle: "Análisis IA listo · FE-9001",
      readySub: "Revisión completada y disponible",
      streamSteps: [
        "Agente LMM Cloud · Leyendo DOC-001.pdf y orden DOC-OC-9001.pdf...",
        "Cruzando subtotales comparables antes de IVA ($52 M vs. $50 M)...",
        "Estructurando dictamen de lectura para causación...",
      ],
      kpis: [
        {
          label: "Subtotal factura vs. OC",
          val: "$52,0M vs. $50,0M",
          sub: "Desviación: +$2.000.000 (+4,00 %)",
        },
        {
          label: "IVA (19 %) y Total",
          val: "$9,88M · Total $61,88M",
          sub: "Retenciones ($3,92M) informadas aparte",
        },
        {
          label: "Previsualización de causación",
          val: "Cuenta 5135 / CC-01",
          sub: "Base autorizada actual: $50.000.000",
        },
      ],
      tableCaption:
        "Cruce línea por línea entre factura, orden de compra y contrato",
      rows: [],
      blocks: [
        {
          title: "Base de comparación homogénea (Subtotal vs. Subtotal)",
          copy: 'El motor descarta comparar el neto a pagar (<span class="lmm-num">COP 57.954.000</span>) o el total con IVA (<span class="lmm-num">COP 61.880.000</span>) contra el tope contractual sin impuestos. Al comparar bases homogéneas antes de IVA (<span class="lmm-num">COP 52.000.000</span> vs. <span class="lmm-num">COP 50.000.000</span>), se aísla con exactitud el sobrecosto comercial de <span class="lmm-num">COP 2.000.000</span>.',
        },
        {
          title: "Tratamiento contable de retenciones informadas",
          copy: 'Las retenciones leídas en el PDF (ReteFuente, ReteICA y ReteIVA por <span class="lmm-num">COP 3.926.000</span>) se registran como metadato informativo para tesorería, sin restarlas del total de la factura.',
        },
        {
          title: "Condición para liberar la causación en cuenta 5135",
          copy: 'Para habilitar el paso a estado <span class="lmm-tag">PROPUESTA</span> en la cuenta <span class="lmm-tag">5135 · Servicios</span> y centro de costo <span class="lmm-tag">CC-01</span>, una persona con rol Aprobadora debe asociar el documento de respaldo (adenda o autorización comercial) conservando el hallazgo original en la auditoría.',
        },
      ],
      plainText: `[REPORTE CLOUD LMM · SOLO LECTURA]\nEXPEDIENTE: INV-001 / FACTURA: FE-9001\nPROVEEDOR: Servicios Integrados Colombia S.A.S. (NIT 900654321-0)\nDOCUMENTOS CRUZADOS: DOC-001.pdf, DOC-OC-9001.pdf, DOC-CT-01.pdf\n\n1. RESUMEN DE CONCILIACIÓN\n- Subtotal Factura (DOC-001):     COP 52.000.000\n- Subtotal Orden (DOC-OC-9001):   COP 50.000.000\n- Diferencia neta en base (D2):  +COP  2.000.000 (+4,00 %)\n- IVA 19 % verificado (V3):       COP  9.880.000\n- Total con IVA (V4):             COP 61.880.000\n\n2. DICTAMEN PARA EL ANALISTA FINANCIERO\n- Estado actual: EXCEPCION (Bloqueo preventivo de causación).\n- Cuenta sugerida por catálogo: 5135 · Servicios / Centro CC-01.\n- Acción requerida en Revisiones: Autorizar diferencia con soporte firmado o solicitar ajuste al emisor.`,
      hash: "SHA-256: 8f94d2c1a04b...e41b · Trazabilidad NEPXA 2026",
    },
    "FE-1001": {
      execId: "ID #CLOUD-LMM-1001",
      sources:
        "DOC-002.pdf · DOC-OC-1001.pdf · DOC-CT-04.pdf · DOC-REC-1001.pdf",
      kicker: "DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · ESCENARIO E01",
      title: "Certificación de conciliación completa para Factura FE-1001",
      subtitle:
        "Todas las reglas financieras y documentales superadas sin desviaciones",
      stampState: "CON PROPUESTA (100 % OK)",
      stampConf: "9 reglas OK · 0 alertas",
      summaryTone: "success",
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy:
        'El expediente <span class="lmm-tag">FE-1001</span> presenta coincidencia exacta entre la factura electrónica (<span class="lmm-tag">DOC-002</span>), la Orden de Compra <span class="lmm-tag">OC-1001</span>, el contrato vigente <span class="lmm-tag">CT-04</span> y el acta de recepción firmada <span class="lmm-tag">REC-1001</span> por un subtotal de <span class="lmm-num">COP 1.000.000</span> (<span class="lmm-num">COP 1.190.000</span> con IVA del 19 %). La propuesta contable en la cuenta <span class="lmm-tag">5135</span> y centro <span class="lmm-tag">CC-02</span> está lista para decisión humana.',
      triggerLabel: "Verificar conciliación con Orden de Compra (LMM)",
      readyTitle: "Análisis IA listo · FE-1001",
      readySub: "Revisión completada y disponible",
      streamSteps: [
        "Agente LMM Cloud · Verificando factura DOC-002 y orden DOC-OC-1001...",
        "Comprobando acta de recepción DOC-REC-1001 y vigencia de CT-04...",
        "Generando certificado estructurado de propuesta contable...",
      ],
      kpis: [
        {
          label: "Subtotal conciliado",
          val: "$1.000.000 COP",
          sub: "Diferencia contra OC-1001: $0 (0,00 %)",
        },
        {
          label: "IVA (19 %) y Total",
          val: "$190.000 · Total $1,19M",
          sub: "Reglas aritméticas superadas sin ajuste",
        },
        {
          label: "Propuesta lista en catálogo",
          val: "Cuenta 5135 / CC-02",
          sub: "Pendiente únicamente de firma humana",
        },
      ],
      tableCaption: "Verificación integral en 4 documentos del expediente",
      rows: [],
      blocks: [
        {
          title: "Triple cruce documental completado (3-Way Match)",
          copy: 'Los importes (<span class="lmm-num">COP 1.000.000</span>), cantidades y descripciones coinciden sin diferencias entre la factura emitida por <span class="lmm-tag">Consultoría y Procesos Andinos S.A.S.</span>, la orden autorizada <span class="lmm-tag">OC-1001</span> y el soporte de entrega <span class="lmm-tag">REC-1001</span>.',
        },
        {
          title: "Asignación de cuenta y centro desde catálogo cerrado",
          copy: 'Se seleccionó la cuenta <span class="lmm-tag">5135 · Servicios profesionales</span> y el centro de costo <span class="lmm-tag">CC-02</span> directamente del catálogo contable oficial, sin inventar códigos.',
        },
        {
          title: "Separación entre propuesta y aprobación",
          copy: 'Aunque el resultado técnico es 100 % conforme, el sistema mantiene el estado en <span class="lmm-tag">PROPUESTA</span> hasta que la persona con rol Aprobadora registre su decisión con firma verificada.',
        },
      ],
      plainText: `[REPORTE CLOUD LMM · SOLO LECTURA]\nEXPEDIENTE: INV-002 / FACTURA: FE-1001\nPROVEEDOR: Consultoría y Procesos Andinos S.A.S. (NIT 900123456-8)\n\n1. RESULTADO DE VALIDACIÓN\n- Reglas de validación: CORRECTAS\n- Cruces: CORRECTOS (OC-1001 + CT-04 + REC-1001)\n- Subtotal: COP 1.000.000 | IVA: COP 190.000 | Total: COP 1.190.000\n\n2. PROPUESTA DE CAUSACIÓN\n- Cuenta: 5135 · Servicios / Centro: CC-02\n- Estado: PROPUESTA (Lista para aprobación humana).`,
      hash: "SHA-256: 3c19a7b4d210...91a0 · Trazabilidad NEPXA 2026",
    },
    "FE-1003": {
      execId: "ID #CLOUD-LMM-1003",
      sources:
        "DOC-003.pdf (OCR vs. Imagen) · DOC-OC-1003.pdf · DOC-REC-1003.pdf",
      kicker: "DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · REGLAS V4 Y E07",
      title:
        "Auditoría aritmética y detección de discrepancia en Total (FE-1003)",
      subtitle:
        "Desajuste de COP 110.000 entre la suma de control y el total extraído por OCR",
      stampState: "FALLO ARITMÉTICO V4",
      stampConf: "8 reglas OK · 1 fallo V4",
      summaryTone: "warning",
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy:
        'Las líneas de la factura <span class="lmm-tag">FE-1003</span> suman un subtotal exacto de <span class="lmm-num">COP 1.000.000</span> (que coincide con la Orden de Compra <span class="lmm-tag">OC-1003</span>) y un IVA del 19 % por <span class="lmm-num">COP 190.000</span>. Sin embargo, el valor total extraído (<span class="lmm-num">COP 1.300.000</span>) presenta un exceso de <span class="lmm-num">+COP 110.000</span> frente a la suma esperada (<span class="lmm-num">COP 1.190.000</span>). El contraste con el soporte <span class="lmm-tag">REC-1003</span> confirma un error de lectura OCR en el dígito de centenas de mil que debe corregirse y revalidarse antes de causar.',
      triggerLabel: "Analizar desajuste aritmético y OC con LMM",
      readyTitle: "Análisis IA listo · FE-1003",
      readySub: "Revisión completada y disponible",
      streamSteps: [
        "Agente LMM Cloud · Recalculando líneas con precisión Decimal...",
        "Contrastando total leído ($1,30M) contra suma esperada ($1,19M)...",
        "Generando dictamen de reconstrucción aritmética en Visor LMM...",
      ],
      kpis: [
        {
          label: "Suma esperada (Subtotal + IVA)",
          val: "$1.190.000 COP",
          sub: "Respaldada por OC-1003 y REC-1003",
        },
        {
          label: "Total extraído con alerta",
          val: "$1.300.000 COP",
          sub: "Desfase en regla V4: +$110.000 COP",
        },
        {
          label: "Estado de propuesta",
          val: "Anulada por V4",
          sub: "Requiere corregir dato y revalidar",
        },
      ],
      tableCaption: "Reconstrucción decimal de líneas, impuestos y total",
      rows: [],
      blocks: [
        {
          title: "Verificación de descuentos por línea (Cálculo base)",
          copy: 'La primera línea aplica correctamente el descuento de <span class="lmm-num">COP 50.000</span> sobre el bruto de <span class="lmm-num">COP 600.000</span> (<span class="lmm-num">COP 550.000</span>). Sumada a la segunda línea (<span class="lmm-num">COP 450.000</span>), el subtotal de <span class="lmm-num">COP 1.000.000</span> es aritméticamente íntegro.',
        },
        {
          title: "Origen del desajuste en el total leído",
          copy: 'Tanto la orden de compra <span class="lmm-tag">OC-1003</span> como el acta firmada <span class="lmm-tag">REC-1003</span> confirman un total con IVA de <span class="lmm-num">COP 1.190.000</span>. La diferencia de <span class="lmm-num">COP 110.000</span> proviene exclusivamente de la extracción OCR sobre el número impreso.',
        },
        {
          title: "Protocolo de revalidación obligatoria (Escenario E07)",
          copy: 'Al corregir el dato extraído en Revisiones sin modificar el archivo original, el sistema anula el fallo previo, vuelve a correr las comprobaciones y habilita la propuesta contable en la cuenta <span class="lmm-tag">5135 / CC-03</span>.',
        },
      ],
      plainText: `[REPORTE CLOUD LMM · SOLO LECTURA]\nEXPEDIENTE: INV-003 / FACTURA: FE-1003\nPROVEEDOR: Suministros Industriales del Norte S.A.S. (NIT 900456789-3)\n\n1. RECONSTRUCCIÓN DECIMAL\n- Línea 1: 3 * 200.000 - 50.000 = COP 550.000 (OK)\n- Línea 2: 3 * 150.000          = COP 450.000 (OK)\n- Subtotal verificado:           COP 1.000.000 (Coincide con OC-1003)\n- IVA 19 % verificado:          COP   190.000\n- Total esperado vs. leído:     COP 1.190.000 vs. COP 1.300.000 (+110.000)\n\n2. RECOMENDACIÓN PARA CAUSACIÓN\n- Corregir lectura del total a COP 1.190.000 y ejecutar nueva corrida de validación.`,
      hash: "SHA-256: 6b40e1f9c882...17d4 · Trazabilidad NEPXA 2026",
    },
    "FE-1006": {
      execId: "ID #CLOUD-LMM-1006",
      sources: "DOC-006.pdf · DOC-OC-1006.pdf · DOC-CT-09.pdf · (Acta ausente)",
      kicker: "DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · CONTROL DE SOPORTES",
      title: "Informe de evidencia documental incompleta en Factura FE-1006",
      subtitle:
        "El sistema declara el soporte de recepción como no evaluado en lugar de inventar documentos",
      stampState: "FALTA SOPORTE (D4)",
      stampConf: "7 reglas OK · 1 no evaluada",
      summaryTone: "warning",
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy:
        'La factura <span class="lmm-tag">FE-1006</span> por servicios de adecuación técnica (subtotal <span class="lmm-num">COP 3.571.429</span>, total con IVA <span class="lmm-num">COP 4.250.000</span>) concilia en valor y proveedor con la Orden de Compra <span class="lmm-tag">OC-1006</span> y el contrato <span class="lmm-tag">CT-09</span>. No obstante, el contrato exige acta de entrega firmada para autorizar la causación y dicho documento no figura en el expediente. El soporte se marca honestamente como <span class="lmm-tag">NO EVALUADO</span>.',
      triggerLabel: "Consultar dictamen de soportes y OC en LMM",
      readyTitle: "Análisis IA listo · FE-1006",
      readySub: "Revisión completada y disponible",
      streamSteps: [
        "Agente LMM Cloud · Inspeccionando inventario documental de FE-1006...",
        "Verificando cláusula de recepción en OC-1006 y contrato CT-09...",
        "Estructurando reporte de evidencia faltante...",
      ],
      kpis: [
        {
          label: "Subtotal y OC-1006",
          val: "$3.571.429 COP",
          sub: "Coincidencia exacta en valor base",
        },
        {
          label: "Soporte de recepción",
          val: "0 actas adjuntas",
          sub: "Estado transparente: No evaluado",
        },
        {
          label: "Cuenta sugerida en espera",
          val: "Cuenta 5135 / CC-05",
          sub: "Retenida hasta asociar acta firmada",
        },
      ],
      tableCaption:
        "Estado de evaluación por regla ante ausencia de documento soporte",
      rows: [],
      blocks: [
        {
          title: "Principio de no invención de evidencia (Escenario E06)",
          copy: 'Cuando falta un documento requerido para comprobar la entrega del servicio, el motor nunca asume que la recepción ocurrió ni aprueba por omisión: declara el soporte como no evaluado y explica qué archivo falta (<span class="lmm-tag">ACTA-REC-1006.pdf</span>).',
        },
        {
          title: "Conciliación previa de importes garantizada",
          copy: 'El cálculo del subtotal (<span class="lmm-num">COP 3.571.429</span>) e IVA al 19 % (<span class="lmm-num">COP 678.571</span>) ya fue validado contra la orden <span class="lmm-tag">OC-1006</span>, por lo que una vez se anexe el acta no habrá discrepancias de dinero.',
        },
        {
          title: "Acción requerida para desbloquear la propuesta",
          copy: 'El revisor o aprobador debe vincular el archivo del acta firmada desde Revisiones para que la validación pase a estado <span class="lmm-tag">Correcta</span>.',
        },
      ],
      plainText: `[REPORTE CLOUD LMM · SOLO LECTURA]\nEXPEDIENTE: INV-006 / FACTURA: FE-1006\nPROVEEDOR: Ingeniería y Montajes del Valle S.A.S. (NIT 900654987-2)\n\n1. ESTADO DE VALIDACIONES\n- Importes e IVA: CORRECTOS (Total COP 4.250.000)\n- Cruces comerciales: CORRECTOS (Coincide con OC-1006 y CT-09)\n- Soporte de recepción: NO EVALUADO (Falta acta de recepción técnica en el expediente)\n\n2. CRITERIO DE CAUSACIÓN\n- Se mantiene en estado EXCEPCIÓN hasta adjuntar el soporte obligatorio.`,
      hash: "SHA-256: 9d02f8a1e553...44c8 · Trazabilidad NEPXA 2026",
    },
    "FE-1011": {
      execId: "ID #CLOUD-LMM-1011",
      sources: "DOC-011.pdf · DOC-OC-1011.pdf · DOC-CT-11.pdf · DOC-AUT-01.pdf",
      kicker: "DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · EXCEPCIÓN AUTORIZADA",
      title:
        "Trazabilidad de excepción comercial autorizada con soporte (FE-1011)",
      subtitle:
        "Conservación simultánea del hallazgo original (+$500.000) y de la autorización firmada",
      stampState: "AUTORIZADA CON SOPORTE",
      stampConf: "Diferencia justificada · Tol. ≤ $1",
      summaryTone: "success",
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy:
        'La factura <span class="lmm-tag">FE-1011</span> (subtotal <span class="lmm-num">COP 10.000.000</span>) superó inicialmente la Orden de Compra <span class="lmm-tag">OC-1011</span> (<span class="lmm-num">COP 9.500.000</span>) en <span class="lmm-num">+COP 500.000</span>. Una persona con rol autorizado anexó la adenda firmada <span class="lmm-tag">DOC-AUT-01</span> y registró la justificación comercial. El sistema conserva intacto el hallazgo original para auditoría y habilita la propuesta en la cuenta <span class="lmm-tag">5135 / CC-04</span>.',
      triggerLabel: "Ver trazabilidad de adenda y OC en Visor LMM",
      readyTitle: "Análisis IA listo · FE-1011",
      readySub: "Revisión completada y disponible",
      streamSteps: [
        "Agente LMM Cloud · Verificando hallazgo histórico y adenda DOC-AUT-01...",
        "Comprobando tolerancia de redondeo de $0,50 (Escenario E13)...",
        "Compilando dictamen de trazabilidad completa en Visor LMM...",
      ],
      kpis: [
        {
          label: "Hallazgo original conservado",
          val: "+$500.000 COP",
          sub: "Factura $10,0M vs. OC inicial $9,5M",
        },
        {
          label: "Respaldo de autorización",
          val: "DOC-AUT-01 verificado",
          sub: "Firmado y vinculado al expediente",
        },
        {
          label: "Tolerancia aritmética",
          val: "Dif. $0,50 ≤ 1 COP",
          sub: "Cubierta por política de redondeo",
        },
      ],
      tableCaption:
        "Registro dual de hallazgo técnico y decisión humana documentada",
      rows: [],
      blocks: [
        {
          title: "Inmutabilidad del hallazgo original (Regla de Oro)",
          copy: 'Autorizar una excepción comercial nunca borra ni maquilla la diferencia: el visor muestra tanto la desviación inicial de <span class="lmm-num">COP 500.000</span> como el documento <span class="lmm-tag">DOC-AUT-01</span> que la respalda.',
        },
        {
          title: "Aplicación acotada de la tolerancia de 1 COP (Escenario E13)",
          copy: 'El desfase de cincuenta centavos (<span class="lmm-num">COP 0,50</span>) en el cálculo de línea se acepta automáticamente por política de redondeo aritmético, mientras que los <span class="lmm-num">COP 500.000</span> comerciales sí exigieron autorización expresa.',
        },
        {
          title: "Propuesta habilitada para aprobación final",
          copy: 'Con el soporte <span class="lmm-tag">DOC-AUT-01</span> vinculado, la propuesta por base de <span class="lmm-num">COP 10.000.000</span> en la cuenta <span class="lmm-tag">5135 (Licencias y nube) / CC-04</span> queda lista para cierre.',
        },
      ],
      plainText: `[REPORTE CLOUD LMM · SOLO LECTURA]\nEXPEDIENTE: INV-011 / FACTURA: FE-1011\nPROVEEDOR: Tecnología y Nube Empresarial S.A.S. (NIT 900789123-1)\n\n1. TRAZABILIDAD DE EXCEPCIÓN (ESCENARIO E11)\n- Hallazgo original:   Factura COP 10.000.000 vs. OC inicial COP 9.500.000 (+500.000)\n- Soporte anexado:     DOC-AUT-01 (Adenda contractual firmada)\n- Redondeo aritmético: Diferencia de COP 0,50 aceptada por tolerancia <= 1 COP\n\n2. ESTADO PARA CAUSACIÓN\n- Estado actual: PROPUESTA (Habilitada con autorización auditable en cuenta 5135 / CC-04).`,
      hash: "SHA-256: 7a11c9e0b342...88f1 · Trazabilidad NEPXA 2026",
    },
    "FE-1004": {
      execId: "ID #CLOUD-LMM-1004",
      sources:
        "DOC-004.pdf · Índice Histórico NIT+Prefijo+Número · DOC-OC-1004.pdf",
      kicker: "DICTAMEN ESTRUCTURADO PARA CAUSACIÓN · CONTROL DE DUPLICIDAD",
      title:
        "Detección de factura duplicada y protección de registro original (FE-1004)",
      subtitle:
        "Prevención de doble causación mediante huella compuesta de emisor y numeración",
      stampState: "RECHAZADA (DUPLICADA)",
      stampConf: "Bloqueo preventivo activo",
      summaryTone: "warning",
      summaryHeading: "Síntesis del modelo para la causación contable",
      summaryCopy:
        'El archivo <span class="lmm-tag">DOC-004</span> corresponde a un segundo intento de registro para la combinación exacta de NIT <span class="lmm-tag">900321654</span>, prefijo <span class="lmm-tag">FE</span> y número <span class="lmm-tag">1004</span> por <span class="lmm-num">COP 2.380.000</span>. El control de duplicidad bloquea automáticamente una nueva propuesta de causación para impedir un doble pago, manteniendo intacto el expediente original donde ya reposan la orden <span class="lmm-tag">OC-1004</span> y sus soportes.',
      triggerLabel: "Ver huella de duplicidad en Visor LMM",
      readyTitle: "Análisis IA listo · FE-1004",
      readySub: "Revisión completada y disponible",
      streamSteps: [
        "Agente LMM Cloud · Consultando índice histórico de claves únicas...",
        "Detectada coincidencia exacta para NIT 900321654 + FE + 1004...",
        "Generando informe de bloqueo preventivo en Visor LMM...",
      ],
      kpis: [
        {
          label: "Clave única evaluada",
          val: "900321654 · FE-1004",
          sub: "Coincidencia 100 % con registro previo",
        },
        {
          label: "Dígito de verificación",
          val: "No impreso en PDF",
          sub: "Reportado como No Evaluado (sin adivinar)",
        },
        {
          label: "Riesgo evitado en causación",
          val: "$2.380.000 COP",
          sub: "Expediente original protegido sin cambios",
        },
      ],
      tableCaption: "Comparación de huella documental contra base histórica",
      rows: [],
      blocks: [
        {
          title: "Aislamiento del segundo intento de carga (Escenario E04)",
          copy: 'El rechazo por duplicidad recae exclusivamente sobre este segundo cargue (<span class="lmm-tag">INV-004</span>). El expediente original conserva su estado, su orden de compra <span class="lmm-tag">OC-1004</span> y sus soportes sin alteración.',
        },
        {
          title: "Manejo transparente del NIT sin dígito de verificación",
          copy: "Como el PDF no incluye el dígito de verificación impreso junto al NIT, la regla se reporta como no evaluada en lugar de autocompletar o adivinar el valor.",
        },
        {
          title: "Cierre contable sin propuesta",
          copy: "Al confirmarse la duplicidad, el motor omite la generación de propuesta en el catálogo de cuentas y deja constancia auditable del bloqueo.",
        },
      ],
      plainText: `[REPORTE CLOUD LMM · SOLO LECTURA]\nEXPEDIENTE: INV-004 / FACTURA: FE-1004\nPROVEEDOR: Logística y Transporte Nacional S.A.S. (NIT 900321654)\n\n1. CONTROL DE DUPLICIDAD\n- Clave detectada: NIT 900321654 + Prefijo FE + Número 1004\n- Estado en base histórica: YA REGISTRADA EN EXPEDIENTE ORIG-1004\n- Dígito de verificación: NO EVALUADO (No impreso en el documento)\n\n2. DICTAMEN\n- Se rechaza este segundo intento de procesamiento para evitar doble causación por COP 2.380.000.`,
      hash: "SHA-256: 5e82d0c3f119...60b2 · Trazabilidad NEPXA 2026",
    },
  };

  const toast = (message) => {
    const element = $("[data-toast]");
    if (!element) return;
    element.textContent = message;
    element.classList.add("is-visible");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(
      () => element.classList.remove("is-visible"),
      3800,
    );
  };

  const statusClass = (status) =>
    status === "ready"
      ? "status--ready"
      : status === "processing"
        ? "status--processing"
        : "status--review";

  const nowTime = () => {
    const dNow = new Date();
    return `${String(dNow.getHours()).padStart(2, "0")}:${String(dNow.getMinutes()).padStart(2, "0")}`;
  };

  const updateCounters = () => {
    const allRows = $$("[data-queue-list] .queue-row");
    const reviewRows = allRows.filter((r) => r.dataset.status === "review");
    const readyRows = allRows.filter((r) => r.dataset.status === "ready");

    if ($("[data-pill-all]")) $("[data-pill-all]").textContent = allRows.length;
    if ($("[data-pill-review]"))
      $("[data-pill-review]").textContent = reviewRows.length;
    if ($("[data-pill-ready]"))
      $("[data-pill-ready]").textContent = readyRows.length;
    if ($("[data-nav-review-count]"))
      $("[data-nav-review-count]").textContent = reviewRows.length;
  };

  const applyRoleUI = () => {
    const role = roleProfiles[currentRole];
    if (!role) return;
    sessionStorage.setItem("aip_role", currentRole);
    if ($("[data-role-avatar]"))
      $("[data-role-avatar]").textContent = role.code;
    if ($("[data-role-avatar-top]"))
      $("[data-role-avatar-top]").textContent = role.code;
    if ($("[data-role-name]")) $("[data-role-name]").textContent = role.name;
    if ($("[data-role-title]")) $("[data-role-title]").textContent = role.title;
    if ($("[data-role-short]")) $("[data-role-short]").textContent = role.short;
    if ($("[data-workspace-label]"))
      $("[data-workspace-label]").textContent = role.workspace;
    if ($("[data-setting-role]")) $("[data-setting-role]").value = currentRole;
    setActiveCase(activeCase);
  };

  const applyQueueFilters = () => {
    const query = ($("[data-review-search]")?.value || "").trim().toLowerCase();
    const matchingRows = [];
    $$("[data-queue-list] .queue-row").forEach((row) => {
      const matchesFilter =
        activeFilter === "all" || row.dataset.status === activeFilter;
      const matchesPeriod =
        activePeriod === "all" || row.dataset.period === activePeriod;
      const matchesSearch =
        !query || (row.dataset.search || "").toLowerCase().includes(query);
      row.hidden = true;
      if (matchesFilter && matchesPeriod && matchesSearch)
        matchingRows.push(row);
    });
    const totalPages = Math.max(
      1,
      Math.ceil(matchingRows.length / queuePageSize),
    );
    activeQueuePage = Math.min(activeQueuePage, totalPages);
    const pageStart = (activeQueuePage - 1) * queuePageSize;
    matchingRows.slice(pageStart, pageStart + queuePageSize).forEach((row) => {
      row.hidden = false;
    });

    const empty = $("[data-empty-filter]");
    if (empty) empty.hidden = matchingRows.length > 0;
    const count = $("[data-queue-count]");
    if (count) count.textContent = matchingRows.length;
    const pageStatus = $("[data-page-status]");
    if (pageStatus)
      pageStatus.textContent = `Página ${activeQueuePage} de ${totalPages}`;
    const previousPage = $("[data-page-prev]");
    const nextPage = $("[data-page-next]");
    if (previousPage) previousPage.disabled = activeQueuePage <= 1;
    if (nextPage) nextPage.disabled = activeQueuePage >= totalPages;
    updateCounters();
  };

  const timelineCompactTitle = (item) => {
    const title = String(item.time || "")
      .split(" · ")
      .slice(1)
      .join(" · ")
      .trim();
    const compactRules = [
      [
        /^Factura recibida(?: y datos extraídos| y leída(?: por OCR)?| y validada en cálculos)?$/,
        "Factura recibida",
      ],
      [/^Orden de compra y contrato vinculados$/, "OC y contrato vinculados"],
      [
        /^Diferencia detectada frente a la orden(?: \(Regla D2\))?$/,
        "Diferencia frente a OC",
      ],
      [/^Diferencia frente a OC inicial detectada$/, "Diferencia frente a OC"],
      [/^Validación completa sin alertas$/, "Validación completa"],
      [/^Propuesta básica generada$/, "Propuesta generada"],
      [/^Fallo en regla V4 \(Total no cuadra\)$/, "Total no cuadra"],
      [/^Soporte faltante detectado \(Regla D4\)$/, "Soporte faltante"],
      [/^Adenda DOC-AUT-01 asociada al expediente$/, "Adenda asociada"],
      [/^Excepción comercial autorizada$/, "Excepción autorizada"],
      [
        /^Coincidencia exacta en el historial \(Regla V6\)$/,
        "Duplicidad detectada",
      ],
      [/^Segundo procesamiento rechazado$/, "Procesamiento rechazado"],
      [/^Nueva carga recibida$/, "Carga recibida"],
      [/^Dato corregido por .+$/, "Dato corregido"],
      [/^Validación reejecutada y propuesta lista$/, "Validación reejecutada"],
      [/^Soporte .+ asociado$/, "Soporte asociado"],
      [/^Excepción autorizada y propuesta lista$/, "Excepción autorizada"],
      [/^Propuesta rechazada por .+$/, "Propuesta rechazada"],
    ];
    return compactRules.find(([pattern]) => pattern.test(title))?.[1] || title;
  };

  const renderTimeline = (caseId) => {
    const data = cases[caseId];
    const list = $("[data-timeline-list]");
    if ($("[data-timeline-case-id]"))
      $("[data-timeline-case-id]").textContent = data?.invoice || caseId;
    if (!data || !list || !data.timeline) return;
    list.innerHTML = data.timeline
      .map((item) => {
        const tone =
          item.dot === "green"
            ? "green"
            : item.dot === "amber"
              ? "amber"
              : "blue";
        return (
          `<div class="timeline-item">` +
          `<span class="timeline-pin timeline-pin--${tone}" aria-hidden="true"><i></i></span>` +
          `<span class="timeline-item__title"><strong>${item.time.split(" · ")[0]} · ${timelineCompactTitle(item)}</strong></span>` +
          `<b class="activity-tag activity-tag--${tone}">${item.tag}</b>` +
          `</div>`
        );
      })
      .join("");
  };

  const auditStatusTone = (status) =>
    status === "ready" ? "green" : status === "processing" ? "blue" : "amber";
  const auditStatusClass = (status) =>
    status === "ready"
      ? "pill--ready"
      : status === "processing"
        ? "pill--neutral"
        : "pill--review";

  const renderAuditHistory = (caseId = activeCase) => {
    const list = $("[data-audit-history-list]");
    if (!list) return;
    const query = auditQuery.trim().toLowerCase();
    const entries = Object.entries(cases).filter(([id, data]) => {
      const matchesFilter =
        activeAuditFilter === "all" || data.status === activeAuditFilter;
      const haystack =
        `${id} ${data.invoice || ""} ${data.vendor || ""} ${data.statusLabel || ""} ${data.subtitle || ""}`.toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
    const pageCount = Math.max(1, Math.ceil(entries.length / auditHistoryPageSize));
    auditHistoryPage = Math.min(Math.max(1, auditHistoryPage), pageCount);
    const pageStart = (auditHistoryPage - 1) * auditHistoryPageSize;
    const visibleEntries = entries.slice(pageStart, pageStart + auditHistoryPageSize);
    list.innerHTML = visibleEntries
      .map(([id, data]) => {
        const selected = id === caseId;
        const tone = auditStatusTone(data.status);
        const shortVendor = data.vendor.replace(
          /\s+(S\.A\.S\.|S\.A\.|SAS)$/i,
          "",
        );
        const statusText =
          data.status === "review"
            ? "Revisión"
            : data.status === "ready"
              ? "Propuesta"
              : "En proceso";
        return (
          `<button class="audit-history-item${selected ? " is-selected" : ""}" type="button" data-audit-case="${id}" aria-current="${selected ? "true" : "false"}">` +
          `<span class="activity-badge activity-badge--${tone}" aria-hidden="true"><span class="queue-pin"></span></span>` +
          `<span class="audit-history-item__body"><strong>${data.invoice}</strong><span>${shortVendor}</span><small>${data.statusLabel}</small></span>` +
          `<span class="pill ${auditStatusClass(data.status)}">${statusText}</span></button>`
        );
      })
      .join("");
    const empty = $("[data-audit-empty]");
    if (empty) empty.hidden = entries.length > 0;
    const pagination = $("[data-audit-pagination]");
    if (pagination) {
      pagination.hidden = entries.length <= auditHistoryPageSize;
      const status = $("[data-audit-page-status]");
      if (status) status.textContent = `Página ${auditHistoryPage} de ${pageCount} · ${entries.length} causaciones`;
      const previous = $("[data-audit-page-prev]");
      const next = $("[data-audit-page-next]");
      if (previous) previous.disabled = auditHistoryPage <= 1;
      if (next) next.disabled = auditHistoryPage >= pageCount;
    }
  };

  const renderAuditTimeline = (caseId = activeCase) => {
    const data = cases[caseId];
    const timeline = $("[data-audit-timeline]");
    if (!data || !timeline) return;
    const title = $("[data-audit-title]");
    const subtitle = $("[data-audit-sub]");
    const status = $("[data-audit-status]");
    const count = $("[data-audit-event-count]");
    if (title) title.textContent = `Línea de tiempo · ${data.invoice}`;
    if (subtitle) subtitle.textContent = `${data.vendor} · ${data.invoice}`;
    if (status) {
      status.textContent = data.statusLabel;
      status.className = `pill ${auditStatusClass(data.status)}`;
    }
    if (count) count.textContent = data.timeline.length;
    timeline.innerHTML = data.timeline
      .map((item, index) => {
        const tone =
          item.dot === "green"
            ? "green"
            : item.dot === "amber"
              ? "amber"
              : "blue";
        const [time] = String(item.time || "").split(" · ");
        return (
          `<li class="audit-timeline__item audit-timeline__item--${tone}">` +
          `<div class="audit-timeline__marker" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></div>` +
          `<article class="audit-timeline__card"><small>${time}</small><strong>${timelineCompactTitle(item)}</strong><p>${item.detail}</p><b class="audit-timeline__tag">${item.tag}</b></article>` +
          `</li>`
        );
      })
      .join("");
  };

  const renderAuditHistoryWorkspace = (caseId = activeCase) => {
    renderAuditHistory(caseId);
    renderAuditTimeline(caseId);
  };

  const applyAuditFilters = () => renderAuditHistoryWorkspace(activeCase);

  const renderTraceTree = (caseId) => {
    const data = cases[caseId];
    const tree = $("[data-trace-tree]");
    if (!data || !tree) return;

    if ($("[data-tree-case-id]")) $("[data-tree-case-id]").textContent = data.invoice;
    $$("[data-tree-select]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.treeSelect === caseId);
    });

    if ($("[data-node-ingest-title]"))
      $("[data-node-ingest-title]").textContent = `${data.invoice} · Recibida`;
    if ($("[data-node-ingest-sub]"))
      $("[data-node-ingest-sub]").textContent = `${data.docs.invoice.preview}`;
    if ($("[data-node-extract-title]"))
      $("[data-node-extract-title]").textContent =
        `Subtotal ${data.docs.invoice.subtotal}`;
    if ($("[data-node-extract-sub]"))
      $("[data-node-extract-sub]").textContent = `Orden: ${data.order}`;

    let activeBranch = "exception";
    let branchTone = "is-warning";

    const failedChecks = data.checks.filter((check) => check.result !== "passed");
    if (!failedChecks.length) {
      activeBranch = "clean";
      branchTone = "is-success";
    } else if (failedChecks.some((check) => String(check.rule_id || "").startsWith("V"))) {
      activeBranch = "correction";
      branchTone = data.status === "ready" ? "is-success" : "is-warning";
    } else {
      activeBranch = "exception";
      branchTone = data.status === "ready" ? "is-success" : "is-warning";
    }

    if ($("[data-node-clean-sub]")) $("[data-node-clean-sub]").textContent = "";
    if ($("[data-node-exc-title]")) {
      $("[data-node-exc-title]").textContent =
        activeBranch === "exception"
          ? "Diferencia comercial"
          : "Diferencia o soporte";
    }
    if ($("[data-node-exc-sub]")) $("[data-node-exc-sub]").textContent = "";
    if ($("[data-node-corr-title]")) {
      $("[data-node-corr-title]").textContent =
        activeBranch === "correction"
          ? "Corrección requerida"
          : "Corrección o duplicidad";
    }
    if ($("[data-node-corr-sub]")) $("[data-node-corr-sub]").textContent = "";

    if ($("[data-node-prop-title]")) {
      const proposalStatus = String(data.proposalStatus || "")
        .split("(")[0]
        .trim();
      $("[data-node-prop-title]").textContent = `Propuesta ${proposalStatus}`;
    }
    if ($("[data-node-prop-sub]")) $("[data-node-prop-sub]").textContent = "";

    const decTitle = $("[data-node-dec-title]");
    const decSub = $("[data-node-dec-sub]");
    if (decTitle && decSub) {
      if (data.businessState === "APROBADA") {
        decTitle.textContent = "Aprobada";
        decSub.textContent = "";
      } else if (data.businessState === "RECHAZADA") {
        decTitle.textContent = "Rechazada";
        decSub.textContent = "";
      } else if (data.status === "ready") {
        decTitle.textContent = "Lista para aprobar";
        decSub.textContent = "";
      } else {
        decTitle.textContent = "Revisión humana";
        decSub.textContent = "";
      }
    }

    const nodeClean = $('[data-node="branch-clean"]', tree);
    const nodeExc = $('[data-node="branch-exception"]', tree);
    const nodeCorr = $('[data-node="branch-correction"]', tree);
    const nodeProp = $('[data-node="proposal"]', tree);
    const nodeDec = $('[data-node="decision"]', tree);

    [nodeClean, nodeExc, nodeCorr, nodeProp, nodeDec].forEach((n) => {
      if (!n) return;
      n.classList.remove("is-active", "is-warning", "is-success", "is-current");
    });

    if (activeBranch === "clean" && nodeClean)
      nodeClean.classList.add(branchTone, "is-current");
    if (activeBranch === "exception" && nodeExc)
      nodeExc.classList.add(branchTone, "is-current");
    if (activeBranch === "correction" && nodeCorr)
      nodeCorr.classList.add(branchTone, "is-current");

    const propTone =
      data.proposalPill === "pill--ready" ? "is-success" : "is-warning";
    if (nodeProp) nodeProp.classList.add(propTone);
    const decTone =
      data.businessState === "APROBADA"
        ? "is-success"
        : data.businessState === "RECHAZADA"
          ? "is-warning"
          : "is-active";
    if (nodeDec) nodeDec.classList.add(decTone);

    $$(".tree-edge", tree).forEach((edge) => {
      edge.classList.remove("is-active", "is-warning", "is-success");
      const key = edge.dataset.edge || "";
      if (key === activeBranch || key === `${activeBranch}-out`) {
        edge.classList.add(branchTone);
      }
    });

    if (
      canAnimate &&
      $('[data-route-view="resumen"]')?.classList.contains("is-visible")
    ) {
      window.gsap.fromTo(
        $$(
          '.tree-node.is-current, [data-node="proposal"], [data-node="decision"]',
          tree,
        ),
        { scale: 0.96, autoAlpha: 0.7 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.34,
          stagger: 0.05,
          ease: "back.out(1.5)",
          clearProps: "transform",
        },
      );
    }
  };

  const animateResumenCharts = () => {
    if (!canAnimate) return;
    const resumen = $('[data-route-view="resumen"]');
    if (!resumen) return;

    window.gsap.fromTo(
      $$(".bar-pill", resumen),
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 0.55,
        stagger: 0.025,
        ease: "back.out(1.25)",
        clearProps: "transform",
      },
    );
    const callout = $("[data-bar-callout]", resumen);
    if (callout) {
      window.gsap.fromTo(
        callout,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          delay: 0.28,
          ease: "back.out(1.6)",
        },
      );
    }
    window.gsap.fromTo(
      $$(".finding-bar i", resumen),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: "power2.out",
        clearProps: "transform",
      },
    );
    window.gsap.fromTo(
      $$(".tree-node", resumen),
      { y: 10, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.4,
        stagger: 0.045,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility",
      },
    );
    window.gsap.fromTo(
      $$(
        "#resumen .timeline-item, [data-timeline-list] .timeline-item",
        resumen,
      ),
      { x: -10, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.36,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility",
      },
    );
  };

  const renderLmmViewer = (caseId, withSpinner = false) => {
    const data = cases[caseId];
    const lmm = data?.lmm || lmmResponses[caseId];
    if (!data || !lmm) return;
    if (!data || !lmm) return;

    $$("[data-lmm-case]").forEach((btn) => {
      const selected = btn.dataset.lmmCase === caseId;
      btn.classList.toggle("is-selected", selected);
      if (selected) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });

    if ($("[data-lmm-sources]"))
      $("[data-lmm-sources]").textContent = lmm.sources;
    if ($("[data-lmm-kicker]")) $("[data-lmm-kicker]").textContent = lmm.kicker;
    if ($("[data-lmm-title]")) $("[data-lmm-title]").textContent = lmm.title;
    if ($("[data-lmm-subtitle]"))
      $("[data-lmm-subtitle]").textContent = lmm.subtitle;

    const stampEl = $("[data-lmm-stamp-state]");
    if (stampEl) {
      stampEl.textContent = lmm.stampState;
      stampEl.className = `pill ${lmm.summaryTone === "success" ? "pill--ready" : "pill--review"}`;
    }

    const summaryBox = $("[data-lmm-summary-box]");
    if (summaryBox) {
      summaryBox.className = `lmm-verdict-card ${lmm.summaryTone === "success" ? "lmm-verdict-card--success" : "lmm-verdict-card--warning"}`;
    }
    const verdictIcon = $("[data-lmm-verdict-icon]");
    if (verdictIcon) {
      verdictIcon.className = `activity-badge ${lmm.summaryTone === "success" ? "activity-badge--green" : "activity-badge--amber"}`;
    }

    if ($("[data-lmm-summary-heading]"))
      $("[data-lmm-summary-heading]").textContent = lmm.summaryHeading;
    if ($("[data-lmm-summary-copy]"))
      $("[data-lmm-summary-copy]").innerHTML = lmm.summaryCopy;

    const operational = lmm.operational || {};
    const risk = operational.risk || {};
    const proposal = operational.proposal || {};
    const setText = (selector, value) => {
      const element = $(selector);
      if (element) element.textContent = value || "No reportado";
    };
    const setProgress = (selector, value) => {
      const element = $(selector);
      const fill = $("i", element);
      const normalized = Number.isFinite(Number(value))
        ? Math.max(0, Math.min(100, Number(value)))
        : 0;
      if (element) {
        element.setAttribute("aria-valuenow", String(normalized));
        if (fill) fill.style.width = `${normalized}%`;
      }
    };
    setText("[data-lmm-risk-level]", risk.level || "No reportado");
    setText("[data-lmm-risk-score]", risk.score || "No reportado");
    setText("[data-lmm-risk-confidence]", risk.confidence || "No reportado");
    setProgress("[data-lmm-risk-score-bar]", risk.scoreValue);
    setProgress("[data-lmm-risk-confidence-bar]", risk.confidenceValue);
    const riskPill = $("[data-lmm-risk-level]");
    if (riskPill) riskPill.className = `lmm-context-pill lmm-context-pill--${risk.tone || "neutral"}`;
    setText("[data-lmm-proposal-status]", proposal.status || "Sin propuesta");
    setText("[data-lmm-proposal-account]", proposal.account || "—");
    setText("[data-lmm-proposal-cost-center]", proposal.costCenter || "—");
    setText("[data-lmm-proposal-subtotal]", proposal.subtotal || "—");
    setText("[data-lmm-proposal-tax]", proposal.tax || "—");
    setText("[data-lmm-proposal-total]", proposal.total || "—");
    const proposalPill = $("[data-lmm-proposal-status]");
    if (proposalPill) proposalPill.className = `lmm-context-pill lmm-context-pill--${proposal.tone || "neutral"}`;

    const exceptionList = $("[data-lmm-exceptions]");
    const exceptionItems = Array.isArray(operational.exceptions) ? operational.exceptions : [];
    if (exceptionList) {
      exceptionList.innerHTML = exceptionItems.length
        ? exceptionItems.map((exception) => `
            <article class="lmm-exception-item">
              <div class="lmm-exception-item__head">
                <div>
                  <strong>${escapeHtml(exception.type)}</strong>
                  <p>${escapeHtml(exception.message)}</p>
                </div>
                <span class="lmm-context-pill lmm-context-pill--warning">${escapeHtml(exception.severity)}</span>
              </div>
              <dl class="lmm-exception-facts">
                <div><dt>Esperado</dt><dd>${escapeHtml(exception.expected)}</dd></div>
                <div><dt>Actual</dt><dd>${escapeHtml(exception.actual)}</dd></div>
                <div><dt>Diferencia</dt><dd>${escapeHtml(exception.difference)}</dd></div>
                <div><dt>Estado</dt><dd>${escapeHtml(exception.status)}</dd></div>
              </dl>
            </article>
          `).join("")
        : `<div class="lmm-empty-context">No hay excepciones detalladas reportadas por el backend.</div>`;
    }
    setText("[data-lmm-exception-count]", `${exceptionItems.length} ${exceptionItems.length === 1 ? "hallazgo" : "hallazgos"}`);

    if (lmm.kpis?.[0]) {
      if ($("[data-lmm-kpi1-label]"))
        $("[data-lmm-kpi1-label]").textContent = lmm.kpis[0].label;
      if ($("[data-lmm-kpi1-val]"))
        $("[data-lmm-kpi1-val]").textContent = lmm.kpis[0].val;
      if ($("[data-lmm-kpi1-sub]"))
        $("[data-lmm-kpi1-sub]").textContent = lmm.kpis[0].sub;
    }
    if (lmm.kpis?.[1]) {
      if ($("[data-lmm-kpi2-label]"))
        $("[data-lmm-kpi2-label]").textContent = lmm.kpis[1].label;
      if ($("[data-lmm-kpi2-val]"))
        $("[data-lmm-kpi2-val]").textContent = lmm.kpis[1].val;
      if ($("[data-lmm-kpi2-sub]"))
        $("[data-lmm-kpi2-sub]").textContent = lmm.kpis[1].sub;
    }
    if (lmm.kpis?.[2]) {
      if ($("[data-lmm-kpi3-label]"))
        $("[data-lmm-kpi3-label]").textContent = lmm.kpis[2].label;
      if ($("[data-lmm-kpi3-val]"))
        $("[data-lmm-kpi3-val]").textContent = lmm.kpis[2].val;
      if ($("[data-lmm-kpi3-sub]"))
        $("[data-lmm-kpi3-sub]").textContent = lmm.kpis[2].sub;
    }

    if ($("[data-lmm-blocks]")) {
      $("[data-lmm-blocks]").innerHTML = lmm.blocks
        .map(
          (b, idx) =>
            `<article class="lmm-reading-point">` +
            `<span class="lmm-reading-point__dot" aria-hidden="true">${idx + 1}</span>` +
            `<div><strong>${b.title}</strong><p>${b.copy}</p></div>` +
            `</article>`,
        )
        .join("");
    }
    const tableBody = $("[data-lmm-table-body]");
    if (tableBody) {
      tableBody.innerHTML = (lmm.rows || []).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="4">El backend no devolvió controles tabulares para este expediente.</td></tr>`;
    }
    if ($("[data-lmm-table-caption]")) $("[data-lmm-table-caption]").textContent = lmm.tableCaption || "Valores recibidos del backend";

    if ($("[data-lmm-footer-hash]"))
      $("[data-lmm-footer-hash]").textContent = lmm.hash;

    const skeleton = $("[data-lmm-skeleton]");
    const sheet = $("[data-lmm-sheet]");
    window.clearTimeout(lmmSkeletonTimer);

    if (withSpinner && !reducedMotion && skeleton && sheet) {
      skeleton.hidden = false;
      sheet.hidden = true;
      if ($("[data-lmm-skeleton-title]")) {
        $("[data-lmm-skeleton-title]").textContent =
          `Cargando lectura de ${caseId} desde Cloud LMM...`;
      }
      lmmSkeletonTimer = window.setTimeout(() => {
        skeleton.hidden = true;
        sheet.hidden = false;
        if (canAnimate) {
          window.gsap.fromTo(
            sheet,
            { autoAlpha: 0, y: 10 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.38,
              ease: "power2.out",
              clearProps: "transform,opacity,visibility",
            },
          );
          window.gsap.fromTo(
            $$(".lmm-verdict-card, .lmm-reading-point, .lmm-kpi-card", sheet),
            { autoAlpha: 0, y: 8 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.32,
              stagger: 0.045,
              ease: "power2.out",
              clearProps: "transform,opacity,visibility",
            },
          );
        }
      }, 420);
    } else {
      if (skeleton) skeleton.hidden = true;
      if (sheet) sheet.hidden = false;
    }
  };

  const updateInlineLmmBox = (caseId) => {
    const lmm = cases[caseId]?.lmm || lmmResponses[caseId];
    if (!lmm) return;
    if ($("[data-lmm-trigger-label]"))
      $("[data-lmm-trigger-label]").textContent = lmm.triggerLabel;
    if ($("[data-lmm-ready-title]"))
      $("[data-lmm-ready-title]").textContent = "RESPUESTA DE CLAUDE";
    if ($("[data-lmm-ready-sub]"))
      $("[data-lmm-ready-sub]").textContent = lmm.readySub;
    runInlineLmmStream(caseId, false);
  };

  const runInlineLmmStream = (caseId, showToastOnFinish = true) => {
    const lmm = cases[caseId]?.lmm || lmmResponses[caseId];
    if (!lmm) return;
    const streamBox = $("[data-lmm-stream-state]");
    const readyBanner = $("[data-lmm-ready-banner]");
    const streamBar = $("[data-lmm-stream-bar]");
    const streamStep = $("[data-lmm-stream-step]");
    const streamTitle = $("[data-lmm-stream-title]");

    if (!streamBox || !readyBanner) return;
    window.clearTimeout(lmmStreamTimer);

    if (reducedMotion) {
      streamBox.hidden = true;
      readyBanner.hidden = false;
      return;
    }

    readyBanner.hidden = true;
    streamBox.hidden = false;
    if (streamTitle)
      streamTitle.textContent = `Agente LMM Cloud · Procesando ${caseId}...`;
    if (streamStep) streamStep.textContent = lmm.streamSteps[0];
    if (streamBar) streamBar.style.width = "28%";

    if (canAnimate) {
      window.gsap.fromTo(
        streamBox,
        { autoAlpha: 0, y: 5 },
        { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" },
      );
    }

    lmmStreamTimer = window.setTimeout(() => {
      if (streamStep) streamStep.textContent = lmm.streamSteps[1];
      if (streamBar) streamBar.style.width = "68%";

      lmmStreamTimer = window.setTimeout(() => {
        if (streamStep) streamStep.textContent = lmm.streamSteps[2];
        if (streamBar) streamBar.style.width = "100%";

        lmmStreamTimer = window.setTimeout(() => {
          streamBox.hidden = true;
          readyBanner.hidden = false;
          if (canAnimate) {
            window.gsap.fromTo(
              readyBanner,
              { scale: 0.96, autoAlpha: 0, y: 4 },
              {
                scale: 1,
                autoAlpha: 1,
                y: 0,
                duration: 0.36,
                ease: "back.out(1.6)",
                clearProps: "transform,opacity,visibility",
              },
            );
          }
          if (showToastOnFinish) {
            toast(
              `Respuesta de Cloud LMM lista para ${caseId}. Haz clic en «Ver en Visor LMM →».`,
            );
          }
        }, 440);
      }, 520);
    }, 480);
  };

  const DOC_KEYS = ["invoice", "purchase", "contract", "support"];
  const DOC_META = {
    invoice: {
      title: "Factura electrónica",
      ext: "FE",
      cufe: "CUFE-DIAN: 8e4b7c12f09a83d5e672b14c90d8a17f3e2b5c89",
    },
    purchase: {
      title: "Orden de compra oficial",
      ext: "OC",
      cufe: "REF SAP: OC-AUT-COMPRAS-2026-VAL-9001",
    },
    contract: {
      title: "Contrato comercial marco",
      ext: "CT",
      cufe: "CONTRATO FIRMADO: CLÁUSULA CT-LEGAL-REG-0042",
    },
    support: {
      title: "Actas y soportes de entrega",
      ext: "SOP",
      cufe: "ACTA DE RECIBIDO: AR-SATISFACCION-REVISIÓN",
    },
  };
  const API_CATEGORY_BY_TAB = {
    invoice: "invoice",
    purchase: "purchase_order",
    contract: "contract",
    support: "support",
  };

  const getApiDocumentForTab = (data, tabKey) => {
    const category = API_CATEGORY_BY_TAB[tabKey];
    return data?.apiDocuments?.find((document) => document.category === category);
  };

  const updatePdfFrameZoom = () => {
    const frame = $("[data-pdf-frame]");
    const documentUrl = frame?.dataset.baseUrl;
    if (!frame || !documentUrl) return;
    const separator = documentUrl.includes("#") ? "&" : "#page=1&";
    const pdfZoom = zoomLevel === 100 ? "page-width" : zoomLevel;
    frame.src = documentUrl + separator + "zoom=" + pdfZoom;
  };

  const switchDocTab = (tabKey, direction = 0) => {
    activeTab = tabKey;
    $$("[data-tab]").forEach((item) => {
      const selected = item.dataset.tab === tabKey;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    renderDocumentTab(activeCase, activeTab, direction);
  };

  const navigateDocByDelta = (delta) => {
    const curIdx = DOC_KEYS.indexOf(activeTab);
    const nextIdx = (curIdx + delta + DOC_KEYS.length) % DOC_KEYS.length;
    switchDocTab(DOC_KEYS[nextIdx], delta);
  };

  const renderDocumentTab = (caseId, tabKey, direction = 0) => {
    const data = cases[caseId];
    if (!data) return;
    const doc = data.docs[tabKey] || data.docs.invoice;
    const docIdx = Math.max(0, DOC_KEYS.indexOf(tabKey));
    const apiDocument = getApiDocumentForTab(data, tabKey);
    const documentUrl = data.documentUrls?.[tabKey];
    const isRealPdf =
      Boolean(documentUrl) &&
      String(apiDocument?.mime_type || "").toLowerCase() === "application/pdf";

    if ($("[data-preview-type]"))
      $("[data-preview-type]").textContent = doc.preview;
    if ($("[data-doc-badge]")) $("[data-doc-badge]").textContent = doc.badge;
    if ($("[data-doc-kind]")) $("[data-doc-kind]").textContent = doc.kind;
    if ($("[data-invoice-vendor]"))
      $("[data-invoice-vendor]").textContent = data.vendor;
    if ($("[data-invoice-nit]")) $("[data-invoice-nit]").textContent = data.nit;
    if ($("[data-invoice-number]"))
      $("[data-invoice-number]").textContent = doc.number;
    if ($("[data-invoice-date]"))
      $("[data-invoice-date]").textContent = data.date;
    if ($("[data-invoice-contract]"))
      $("[data-invoice-contract]").textContent = data.contract;
    if ($("[data-invoice-order]"))
      $("[data-invoice-order]").textContent = data.order;
    if ($("[data-invoice-tbody]")) {
      $("[data-invoice-tbody]").innerHTML = doc.rows
        .map(
          (r) =>
            `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`,
        )
        .join("");
    }
    if ($("[data-invoice-subtotal]"))
      $("[data-invoice-subtotal]").textContent = doc.subtotal;
    if ($("[data-invoice-iva]")) $("[data-invoice-iva]").textContent = doc.iva;
    if ($("[data-invoice-total]"))
      $("[data-invoice-total]").textContent = doc.total;
    if ($("[data-invoice-footer]"))
      $("[data-invoice-footer]").textContent = doc.footer;

    // Metadatos dinámicos del visor PDF
    if ($("[data-pdf-doc-index]"))
      $("[data-pdf-doc-index]").textContent = String(docIdx + 1);
    if ($("[data-pdf-doc-total]"))
      $("[data-pdf-doc-total]").textContent = String(DOC_KEYS.length);
    if ($("[data-pdf-doc-title]"))
      $("[data-pdf-doc-title]").textContent =
        `${DOC_META[tabKey]?.title || doc.preview} · ${doc.number}.pdf`;
    if ($("[data-pdf-cufe]"))
      $("[data-pdf-cufe]").textContent =
        DOC_META[tabKey]?.cufe || `DOC-ID: ${doc.number}-SHA256`;
    if (isRealPdf && apiDocument && $("[data-pdf-doc-title]"))
      $("[data-pdf-doc-title]").textContent = apiDocument.file_name;

    const realDocument = $("[data-pdf-real-document]");
    const frame = $("[data-pdf-frame]");
    const sheet = $("[data-invoice-sheet]");
    const pageIndicator = $("[data-pdf-page-indicator]");
    if (realDocument && frame && sheet) {
      if (isRealPdf) {
        realDocument.hidden = false;
        sheet.hidden = true;
        frame.title = "Documento PDF real: " + apiDocument.file_name;
        if (frame.dataset.baseUrl !== documentUrl) {
          frame.dataset.baseUrl = documentUrl;
          const pdfZoom = zoomLevel === 100 ? "page-width" : zoomLevel;
          frame.src = documentUrl + "#page=1&zoom=" + pdfZoom;
        } else {
          updatePdfFrameZoom();
        }
        if (pageIndicator) pageIndicator.hidden = true;
      } else {
        realDocument.hidden = true;
        sheet.hidden = false;
        frame.removeAttribute("src");
        delete frame.dataset.baseUrl;
        if (pageIndicator) {
          pageIndicator.hidden = false;
          pageIndicator.innerHTML =
            'Pág. <strong data-pdf-page-num>1</strong>/1';
        }
      }
    }

    const downloadButton = $("[data-download-doc]");
    if (downloadButton) {
      if (documentUrl) downloadButton.dataset.documentUrl = documentUrl;
      else delete downloadButton.dataset.documentUrl;
    }

    if (direction !== 0 && canAnimate) {
      const sheet = $("[data-invoice-sheet]");
      if (sheet) {
        window.gsap.fromTo(
          sheet,
          { autoAlpha: 0.35, x: direction > 0 ? 18 : -18 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.26,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }
    }
  };

  const renderComparisonDrawer = (c) => {
    const rulesTag = c.rules
      ? `<span class="comparison-drawer__rule-tag">${c.rules}</span>`
      : `<span class="comparison-drawer__rule-tag">Regla verificada</span>`;

    let itemsHtml = "";
    if (Array.isArray(c.breakdown) && c.breakdown.length > 0) {
      itemsHtml = c.breakdown
        .map(
          (b) =>
            `<div class="comparison-drawer__item">` +
            `<span class="comparison-drawer__label">${b.label}</span>` +
            `<strong class="comparison-drawer__val ${b.highlight ? "comparison-drawer__val--" + b.highlight : ""}">${b.val}</strong>` +
            `</div>`,
        )
        .join("");
    } else {
      itemsHtml = [
        {
          label: "Estado",
          val: c.value || (c.icon === "ok" ? "Conforme" : "Alerta"),
          highlight: c.tone || c.icon,
        },
        { label: "Detalle", val: c.detail || "Verificación documental" },
      ]
        .map(
          (b) =>
            `<div class="comparison-drawer__item">` +
            `<span class="comparison-drawer__label">${b.label}</span>` +
            `<strong class="comparison-drawer__val ${b.highlight ? "comparison-drawer__val--" + b.highlight : ""}">${b.val}</strong>` +
            `</div>`,
        )
        .join("");
    }

    const noteText =
      c.note ||
      `${c.detail}. Comprobación ejecutada con precisión decimal exacta según reglas de causación.`;
    return `<div class="comparison-drawer__header">${rulesTag}</div><div class="comparison-drawer__grid">${itemsHtml}</div><p class="comparison-drawer__note">${noteText}</p>`;
  };

  const renderComparisonRow = (c) =>
    `<details class="comparison-row comparison-row--accordion" data-accordion>` +
    `<summary class="comparison-row__summary">` +
    `<span class="comparison-row__icon comparison-row__icon--${c.icon}">${c.symbol}</span>` +
    `<span class="comparison-row__main"><strong>${escapeHtml(c.title)} <span class="comparison-row__code">${escapeHtml(c.code || "")}</span></strong><small>${escapeHtml(c.detail)}</small></span>` +
    `<span class="comparison-row__arrow" aria-label="Ver más">` +
    `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` +
    `</span>` +
    `</summary>` +
    `<div class="comparison-row__drawer"><div class="comparison-drawer-content">${renderComparisonDrawer(c)}</div></div>` +
    `</details>`;

  const setActiveCase = (id) => {
    const data = cases[id];
    if (!data) return;
    activeCase = id;
    $$("[data-queue-list] .queue-row").forEach((row) => {
      const selected = row.dataset.case === id;
      row.classList.toggle("is-selected", selected);
      if (selected) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });

    if ($("[data-detail-id]")) $("[data-detail-id]").textContent = data.invoice;
    const detailStatus = $("[data-detail-status]");
    if (detailStatus) {
      detailStatus.textContent = data.statusLabel;
      detailStatus.className = `pill ${data.status === "ready" ? "pill--ready" : data.status === "processing" ? "pill--neutral" : "pill--review"}`;
    }
    if ($("[data-detail-subtitle]"))
      $("[data-detail-subtitle]").textContent = data.subtitle;
    if ($("[data-support-count]"))
      $("[data-support-count]").textContent = data.supportCount;

    const statusDot = $(".document-heading__id .status");
    if (statusDot) statusDot.className = `status ${statusClass(data.status)}`;

    renderDocumentTab(id, activeTab);
    renderTimeline(id);
    renderTraceTree(id);
    renderAuditHistoryWorkspace(id);
    renderBackendRules(id);
    updateInlineLmmBox(id);
    renderLmmViewer(id, false);

    if ($("[data-confidence-badge]")) {
      const confidenceParts = String(data.confidence)
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean);
      const correctLabel = confidenceParts[0] || data.confidence;
      const alertLabel = confidenceParts.slice(1).join(" · ");
      const confidenceBadge = $("[data-confidence-badge]");
      confidenceBadge.setAttribute(
        "aria-label",
        alertLabel ? `${correctLabel} y ${alertLabel}` : correctLabel,
      );
      confidenceBadge.innerHTML = `<span class="confidence-pin confidence-pin--success" aria-hidden="true"></span><strong>${correctLabel}</strong>${alertLabel ? `<span class="confidence-separator" aria-hidden="true">·</span><span class="confidence-pin confidence-pin--warning" aria-hidden="true"></span><strong>${alertLabel}</strong>` : ""}`;
    }
    if ($("[data-match-title]"))
      $("[data-match-title]").textContent = data.matchTitle;
    if ($("[data-match-subtitle]"))
      $("[data-match-subtitle]").textContent = data.matchSubtitle;
    if ($("[data-comparison-list]")) {
      $("[data-comparison-list]").innerHTML = data.comparisons
        .map((c) => renderComparisonRow(c))
        .join("");
    }
    if ($("[data-exception-title]"))
      $("[data-exception-title]").textContent = data.exceptionTitle;
    if ($("[data-exception-copy]"))
      $("[data-exception-copy]").innerHTML = data.exceptionCopy;
    const proposalStatus = $("[data-proposal-status]");
    if (proposalStatus) {
      proposalStatus.textContent = data.proposalStatus;
      proposalStatus.className = `pill ${data.proposalPill}`;
    }
    if ($("[data-proposal-account]"))
      $("[data-proposal-account]").textContent = data.proposalAccount;
    if ($("[data-proposal-base]"))
      $("[data-proposal-base]").textContent = data.proposalBase;
    if ($("[data-proposal-diff]"))
      $("[data-proposal-diff]").textContent = data.proposalDiff;

    const role = roleProfiles[currentRole];
    const requestBtn = $("[data-request-review]");
    const approve = $("[data-approve]");
    if (requestBtn) {
      requestBtn.textContent = data.secondaryAction;
      requestBtn.classList.toggle(
        "button--correction",
        data.secondaryActionType === "correct",
      );
      requestBtn.disabled =
        currentRole === "lector" &&
        data.secondaryActionType !== "view_original";
    }
    if (approve) {
      const isClosed =
        data.businessState === "APROBADA" || data.businessState === "RECHAZADA";
      approve.disabled = isClosed || !role.canApprove;
      approve.innerHTML =
        !role.canApprove && !isClosed
          ? "Requiere rol Aprobadora"
          : data.primaryAction;
    }
    if ($("[data-audit-text]")) $("[data-audit-text]").innerHTML = data.audit;
  };

  const setFilter = (filter, button) => {
    activeFilter = filter;
    activeQueuePage = 1;
    $$(".filter-pill").forEach((pill) =>
      pill.classList.toggle("is-active", pill === button),
    );
    applyQueueFilters();
  };

  const findCaseKeyByInvoice = (invoiceNumber) =>
    Object.entries(cases).find(([, data]) => data.invoice === invoiceNumber)?.[0] || null;

  const updatePeriodTrigger = () => {
    const labels = {
      all: "Fecha: Todos los períodos",
      "2026-09": "Fecha: Septiembre 2026",
      closed: "Fecha: Agosto 2026",
    };
    const trigger = $("[data-open-period-modal]");
    const label = $("[data-period-trigger-label]");
    if (label) label.textContent = labels[activePeriod] || labels.all;
    if (trigger) trigger.classList.toggle("is-active", activePeriod !== "all");
    $$("[data-period-option]").forEach((option) => {
      const selected = option.dataset.periodOption === activePeriod;
      option.classList.toggle("is-active", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
  };

  const closeAllModals = () => {
    const uploadModal = $("[data-upload-modal]");
    const actionModal = $("[data-action-modal]");
    const periodModal = $("[data-period-modal]");
    const periodTrigger = $("[data-open-period-modal]");
    const backdrop = $("[data-modal-backdrop]");
    if (uploadModal) uploadModal.hidden = true;
    if (actionModal) actionModal.hidden = true;
    if (periodModal) periodModal.hidden = true;
    if (backdrop) backdrop.hidden = true;
    periodTrigger?.setAttribute("aria-expanded", "false");
    d.body.style.overflow = "";
    modalLastFocus?.focus?.();
  };

  const openPeriodModal = () => {
    const modal = $("[data-period-modal]");
    const backdrop = $("[data-modal-backdrop]");
    const trigger = $("[data-open-period-modal]");
    if (!modal || !backdrop) return;
    modalLastFocus = trigger || d.activeElement;
    if ($("[data-upload-modal]")) $("[data-upload-modal]").hidden = true;
    if ($("[data-action-modal]")) $("[data-action-modal]").hidden = true;
    updatePeriodTrigger();
    modal.hidden = false;
    backdrop.hidden = false;
    trigger?.setAttribute("aria-expanded", "true");
    d.body.style.overflow = "hidden";
    window.setTimeout(() => $(".period-option.is-active", modal)?.focus(), 40);
  };

  const openUploadModal = () => {
    const modal = $("[data-upload-modal]");
    const backdrop = $("[data-modal-backdrop]");
    if (!modal || !backdrop) return;
    modalLastFocus = d.activeElement;
    if ($("[data-action-modal]")) $("[data-action-modal]").hidden = true;
    modal.hidden = false;
    backdrop.hidden = false;
    d.body.style.overflow = "hidden";
    window.setTimeout(() => $("[data-file-input]")?.focus(), 40);
  };

  const openActionModal = (mode) => {
    const data = cases[activeCase];
    const modal = $("[data-action-modal]");
    const backdrop = $("[data-modal-backdrop]");
    const kicker = $("[data-action-kicker]");
    const title = $("[data-action-title]");
    const desc = $("[data-action-description]");
    const fields = $("[data-action-fields]");
    const submit = $("[data-action-submit]");
    if (!modal || !backdrop || !fields || !data) return;

    currentActionMode = mode;
    modalLastFocus = d.activeElement;
    if ($("[data-upload-modal]")) $("[data-upload-modal]").hidden = true;

    if (mode === "authorize") {
      kicker.textContent = `Escenario E11 · ${activeCase}`;
      title.textContent = "Autorizar diferencia con soporte";
      desc.textContent =
        "El hallazgo original de la regla D2 se conserva intacto. Registra el soporte y el motivo para habilitar la propuesta.";
      submit.innerHTML =
        'Autorizar y habilitar propuesta <span aria-hidden="true">→</span>';
      fields.innerHTML = `
        <label><span>Documento de respaldo</span><input name="supportDoc" value="DOC-AUT-01 · Adenda firmada" required></label>
        <label><span>Diferencia que se autoriza</span><input value="${data.proposalDiff} sobre Subtotal OC" readonly></label>
        <label style="grid-column:1 / -1"><span>Justificación de la autorización (obligatoria)</span><input name="reason" placeholder="Ej. Ajuste de tarifas aprobado por gerencia según adenda" required minlength="5"></label>
      `;
    } else if (mode === "correct") {
      kicker.textContent = `Escenario E07 · ${activeCase}`;
      title.textContent = "Corregir dato extraído";
      desc.textContent =
        "Corrige un error de lectura sin alterar el PDF original. Esto anula propuestas previas y vuelve a ejecutar las reglas.";
      submit.innerHTML =
        'Guardar y revalidar <span aria-hidden="true">→</span>';
      fields.innerHTML = `
        <label><span>Campo por corregir</span><select name="field"><option value="total">Total facturado (Regla V4)</option><option value="subtotal">Subtotal comparable (Regla V2)</option></select></label>
        <label><span>Valor leído actualmente</span><input value="${data.docs.invoice.total}" readonly></label>
        <label><span>Nuevo valor verificado en el documento</span><input name="newValue" value="${data.checks.find((check) => check.rule_id === "V4")?.expected_amount || data.invoiceData.total || ""}" required></label>
        <label><span>Motivo de la corrección</span><input name="reason" value="Error de lectura OCR en el dígito de centenas de mil" required minlength="5"></label>
      `;
    } else if (mode === "attach") {
      kicker.textContent = `Escenario E06 · ${activeCase}`;
      title.textContent = "Asociar soporte de recepción";
      desc.textContent =
        "Vincula el acta de entrega firmada para evaluar las reglas D4 y D5.";
      submit.innerHTML =
        'Asociar acta y reevaluar <span aria-hidden="true">→</span>';
      fields.innerHTML = `
        <label><span>Identificador del soporte</span><input name="supportDoc" value="ACTA-REC-1006.pdf" required></label>
        <label><span>Estado de recepción</span><select name="receptionState"><option value="conforme">Recepción 100 % conforme (D4 y D5)</option><option value="parcial">Recepción parcial (Escenario E09)</option></select></label>
        <label style="grid-column:1 / -1"><span>Observación de recepción</span><input name="reason" value="Acta firmada por supervisión técnica de planta" required minlength="5"></label>
      `;
    } else if (mode === "reject") {
      kicker.textContent = `Escenario E12 · ${activeCase}`;
      title.textContent = "Rechazar factura con motivo";
      desc.textContent =
        "Detiene la causación de este expediente conservando todas las validaciones y evidencias para auditoría.";
      submit.innerHTML = 'Confirmar rechazo <span aria-hidden="true">→</span>';
      fields.innerHTML = `
        <label><span>Causa principal del rechazo</span><select name="rejectType"><option>Diferencia comercial no autorizada</option><option>Error en factura del emisor (solicitar nota crédito)</option><option>Servicio no corresponde a la necesidad</option></select></label>
        <label><span>Responsable de la decisión</span><input value="${roleProfiles[currentRole].name} (${roleProfiles[currentRole].title})" readonly></label>
        <label style="grid-column:1 / -1"><span>Motivo detallado (obligatorio)</span><input name="reason" placeholder="Escribe la razón que quedará en la línea de tiempo" required minlength="5"></label>
      `;
    } else if (mode === "role") {
      kicker.textContent = "Control de permisos";
      title.textContent = "Cambiar rol o sesión";
      desc.textContent =
        "Simula cómo cambian las acciones permitidas según tu perfil en el equipo financiero.";
      submit.innerHTML =
        'Aplicar rol seleccionado <span aria-hidden="true">→</span>';
      fields.innerHTML = `
        <label style="grid-column:1 / -1"><span>Selecciona el perfil activo</span><select name="selectedRole">
          <option value="aprobador" ${currentRole === "aprobador" ? "selected" : ""}>María Contable · Aprobadora autorizada (autoriza excepciones y aprueba)</option>
          <option value="revisor" ${currentRole === "revisor" ? "selected" : ""}>Julián Revisor · Revisor financiero (corrige lecturas y asocia soportes)</option>
          <option value="lector" ${currentRole === "lector" ? "selected" : ""}>Auditoría Interna · Consulta (solo lectura de expedientes e historial)</option>
        </select></label>
        <label><span>Pantalla pública</span><a class="button button--secondary button--full" href="landing.html">Ir a la portada</a></label>
        <label><span>Acceso de usuario</span><a class="button button--secondary button--full" href="login.html">Cambiar de cuenta</a></label>
      `;
    }

    modal.hidden = false;
    backdrop.hidden = false;
    d.body.style.overflow = "hidden";
    window.setTimeout(
      () => $("input:not([readonly]),select", fields)?.focus(),
      40,
    );
  };

  const refreshCaseAfterAction = (caseId, payload) => {
    hydrateCaseFromApi(caseId, payload);
    renderBackendQueue();
    renderBackendDocuments();
    renderBackendLmmHistory();
    if (cases[activeCase]) setActiveCase(activeCase);
    renderBackendTreeCases();
    applyQueueFilters();
    window.NepxaApi.getSummary()
      .then(hydrateSummaryFromApi)
      .catch((error) => console.warn("[ai-invoice-processor] No se pudieron actualizar los indicadores", error));
  };

  const handleActionSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const current = cases[activeCase];
    const role = roleProfiles[currentRole];
    const time = nowTime();

    if (currentActionMode === "role") {
      const nextRole = formData.get("selectedRole");
      if (roleProfiles[nextRole]) {
        currentRole = nextRole;
        applyRoleUI();
        toast(`Rol activo cambiado a: ${roleProfiles[currentRole].title}`);
      }
      closeAllModals();
      return;
    }

    if (!current) return;
    const reason = (formData.get("reason") || "").toString().trim();

    if (window.NepxaApi && current.invoiceId && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(current.invoiceId)) {
      const apiAction = {
        authorize: "authorize_difference",
        correct: "correct_ocr",
        attach: "attach_support",
        reject: "reject_proposal",
      }[currentActionMode];
      if (apiAction) {
        if (currentActionMode === "authorize" && !role.canAuthorize) {
          toast("Tu rol actual no tiene permisos para autorizar diferencias.");
          return;
        }
        if (currentActionMode === "correct" && !role.canCorrect) {
          toast("Tu rol actual no tiene permisos para corregir datos.");
          return;
        }
        const submit = $("[data-action-submit]");
        if (submit) submit.disabled = true;
        const caseId = activeCase;
        window.NepxaApi.runAction(current.invoiceId, apiAction, {
          reason,
          support_doc: (formData.get("supportDoc") || "").toString().trim() || null,
          new_value: (formData.get("newValue") || "").toString().trim() || null,
          field: (formData.get("field") || "").toString().trim() || null,
          actor_name: role.name,
        }).then((payload) => {
          refreshCaseAfterAction(caseId, payload);
          closeAllModals();
          toast("Decisión registrada en el Backend.");
        }).catch((error) => {
          toast(error.message || "No se pudo registrar la decisión.");
        }).finally(() => {
          if (submit) submit.disabled = false;
        });
        return;
      }
    }

    if (currentActionMode === "authorize") {
      if (!role.canAuthorize) {
        toast(
          "Tu rol actual no tiene permisos para autorizar diferencias comerciales. Cambia a Aprobadora.",
        );
        return;
      }
      const supportDoc = (formData.get("supportDoc") || "DOC-AUT-01")
        .toString()
        .trim();
      current.supportCount = String(Number(current.supportCount || 0) + 1);
      current.status = "ready";
      current.businessState = "PROPUESTA";
      current.statusLabel = "Excepción autorizada";
      current.confidence = "D2 autorizada · Lista";
      current.matchTitle = "Diferencia comercial autorizada con soporte";
      current.matchSubtitle = `Respaldada por ${supportDoc} · Hallazgo D2 conservado`;
      current.exceptionTitle = `Excepción D2 autorizada (${supportDoc})`;
      current.exceptionCopy = `Se conserva el registro de la diferencia de <strong>${current.proposalDiff}</strong> y queda autorizada por <strong>${role.name}</strong>: «${reason}».`;
      current.proposalStatus = "Lista con autorización";
      current.proposalPill = "pill--ready";
      current.docs.support = {
        preview: `Soporte de autorización (${supportDoc})`,
        badge: "[AUTORIZACIÓN FIRMADA]",
        kind: "Evidencia anexada al expediente",
        number: supportDoc,
        rows: [
          [`Autorizado por ${role.name}: ${reason}`, "1", "Firmado", "Válido"],
        ],
        subtotal: current.docs.invoice.subtotal,
        iva: current.docs.invoice.iva,
        total: current.docs.invoice.total,
        footer:
          "Autorizar una excepción conserva el fallo original y habilita la propuesta con trazabilidad.",
      };
      current.timeline.push(
        {
          dot: "green",
          time: `${time} · Soporte ${supportDoc} asociado`,
          detail: `Anexado por ${role.name} sin borrar el hallazgo D2.`,
          tag: "Soporte",
        },
        {
          dot: "green",
          time: `${time} · Excepción autorizada y propuesta lista`,
          detail: `Motivo: ${reason}.`,
          tag: "Propuesta",
        },
      );
      current.audit = `<strong>Historial actualizado (${activeCase}):</strong> Diferencia D2 registrada → Soporte ${supportDoc} anexado → Excepción autorizada por ${role.name} (${time}).`;
      const row = $(`[data-case="${activeCase}"]`);
      if (row) {
        row.dataset.status = "ready";
        $(".status", row).className = "queue-row__status status status--ready";
      }
      setActiveCase(activeCase);
      applyQueueFilters();
      closeAllModals();
      toast(
        `Excepción autorizada con ${supportDoc}. Ya puedes aprobar la propuesta.`,
      );
    } else if (currentActionMode === "correct") {
      const newValue = (formData.get("newValue") || "$1.190.000")
        .toString()
        .trim();
      current.docs.invoice.total = newValue;
      current.status = "ready";
      current.businessState = "PROPUESTA";
      current.statusLabel = "Corregida · Con propuesta";
      current.confidence = "9 correctas · Revalidada";
      current.matchTitle = "Lectura corregida y validación superada";
      current.matchSubtitle = `Total actualizado a ${newValue} sin alterar el PDF original`;
      current.comparisons[1] = {
        icon: "ok",
        symbol: "✓",
        title: "Total de la factura (Regla V4 revalidada)",
        detail: `Subtotal $1.000.000 + IVA $190.000 = ${newValue}`,
        value: "Correcta",
        tone: "ok",
        rules: "Regla V4 revalidada · Lectura OCR corregida",
        breakdown: [
          { label: "Subtotal base", val: "$1.000.000" },
          { label: "IVA 19 %", val: "$190.000" },
          { label: "Total corregido", val: newValue, highlight: "ok" },
          { label: "Estado", val: "Conforme", highlight: "ok" },
        ],
        note: `Total revalidado a ${newValue} cuadrando exactamente la suma aritmética.`,
      };
      current.exceptionTitle = "Desajuste resuelto tras corregir lectura OCR";
      current.exceptionCopy = `Valor corregido a <strong>${newValue}</strong> por <strong>${role.name}</strong> («${reason}»). Se ejecutó una nueva validación y se generó propuesta vigente.`;
      current.proposalStatus = "Lista para aprobar";
      current.proposalPill = "pill--ready";
      current.proposalDiff = "$0 (Revalidada)";
      current.primaryAction =
        'Aprobar propuesta <span aria-hidden="true">→</span>';
      current.timeline.push(
        {
          dot: "blue",
          time: `${time} · Dato corregido por ${role.name}`,
          detail: `Total ajustado a ${newValue}. Motivo: ${reason}.`,
          tag: "Corregida",
        },
        {
          dot: "green",
          time: `${time} · Validación reejecutada y propuesta lista`,
          detail: "Regla V4 superada en nueva corrida de validación.",
          tag: "Propuesta",
        },
      );
      current.audit = `<strong>Historial actualizado (${activeCase}):</strong> Dato corregido a ${newValue} (${time}) → Propuesta previa anulada → Nueva validación V4 correcta.`;
      const row = $(`[data-case="${activeCase}"]`);
      if (row) {
        row.dataset.status = "ready";
        $(".status", row).className = "queue-row__status status status--ready";
        $(".queue-row__amount", row).textContent = newValue;
      }
      setActiveCase(activeCase);
      applyQueueFilters();
      closeAllModals();
      toast(`Dato corregido a ${newValue} y validado nuevamente.`);
    } else if (currentActionMode === "attach") {
      const supportDoc = (formData.get("supportDoc") || "ACTA-REC-1006.pdf")
        .toString()
        .trim();
      current.supportCount = "1";
      current.status = "ready";
      current.businessState = "PROPUESTA";
      current.statusLabel = "Con propuesta";
      current.confidence = "9 correctas · Completa";
      current.matchTitle = "Soporte de recepción verificado";
      current.matchSubtitle = `Acta ${supportDoc} vinculada al expediente`;
      current.comparisons[2] = {
        icon: "ok",
        symbol: "✓",
        title: "Soporte de recepción (Regla D4)",
        detail: `Acta ${supportDoc} firmada y verificada`,
        value: "Correcta",
        tone: "ok",
        rules: "Regla D4 · Soporte de recepción verificado",
        breakdown: [
          { label: "Soporte", val: supportDoc },
          { label: "Motivo", val: reason },
          {
            label: "Estado entrega",
            val: "Recibido a conformidad",
            highlight: "ok",
          },
          { label: "Regla D4", val: "Cumplida", highlight: "ok" },
        ],
        note: `Se anexó el soporte obligatorio ${supportDoc} («${reason}»). Validación documental completa.`,
      };
      current.exceptionTitle = `Soporte ${supportDoc} incorporado`;
      current.exceptionCopy = `Se anexó el soporte obligatorio («${reason}»). Las reglas D4 y D5 quedaron evaluadas y conformes.`;
      current.proposalStatus = "Lista para aprobar";
      current.proposalPill = "pill--ready";
      current.proposalDiff = "$0 (Completa)";
      current.docs.support = {
        preview: `Acta de recepción (${supportDoc})`,
        badge: "[ACTA VERIFICADA]",
        kind: "Soporte de entrega conforme",
        number: supportDoc,
        rows: [
          [`Recepción confirmada: ${reason}`, "1", "$3.571.429", "Conforme"],
        ],
        subtotal: "$3.571.429",
        iva: "$678.571",
        total: "$4.250.000",
        footer: "Reglas D4 y D5 superadas tras asociar el acta.",
      };
      current.timeline.push({
        dot: "green",
        time: `${time} · Soporte ${supportDoc} asociado`,
        detail: `${reason}. Regla D4 pasa de no evaluada a correcta.`,
        tag: "Completa",
      });
      current.audit = `<strong>Historial actualizado (${activeCase}):</strong> Acta ${supportDoc} asociada por ${role.name} (${time}) → Regla D4 correcta → Propuesta lista.`;
      const row = $(`[data-case="${activeCase}"]`);
      if (row) {
        row.dataset.status = "ready";
        $(".status", row).className = "queue-row__status status status--ready";
      }
      setActiveCase(activeCase);
      applyQueueFilters();
      closeAllModals();
      toast(`Soporte ${supportDoc} asociado. El expediente pasó a propuesta.`);
    } else if (currentActionMode === "reject") {
      const rejectType = (
        formData.get("rejectType") || "Rechazo documentado"
      ).toString();
      current.status = "processing";
      current.businessState = "RECHAZADA";
      current.statusLabel = "Rechazada";
      current.proposalStatus = "Rechazada con motivo";
      current.proposalPill = "pill--neutral";
      current.primaryAction =
        'Expediente rechazado <span aria-hidden="true">✓</span>';
      current.exceptionTitle = `Rechazada por ${role.name}`;
      current.exceptionCopy = `Causa: <strong>${rejectType}</strong>. Motivo registrado: «${reason}». Se conservan documentos y validaciones.`;
      current.timeline.push({
        dot: "amber",
        time: `${time} · Propuesta rechazada por ${role.name}`,
        detail: `${rejectType}: ${reason}.`,
        tag: "Rechazada",
      });
      current.audit = `<strong>Historial actualizado (${activeCase}):</strong> Rechazada por ${role.name} (${time}) · Motivo: «${reason}».`;
      const row = $(`[data-case="${activeCase}"]`);
      if (row) {
        row.dataset.status = "processing";
        $(".status", row).className =
          "queue-row__status status status--processing";
      }
      setActiveCase(activeCase);
      applyQueueFilters();
      closeAllModals();
      toast(`Expediente ${activeCase} rechazado con motivo registrado.`);
    }
  };

  const renderFiles = (files) => {
    const list = $("[data-file-list]");
    const process = $("[data-process-files]");
    if (!list || !process) return;
    list.innerHTML = "";
    const selected = [...files];
    list.hidden = selected.length === 0;
    process.disabled = selected.length === 0;
    selected.forEach((file) => {
      const row = d.createElement("div");
      row.className = "file-row";
      row.innerHTML = `<span><strong></strong> <small>${Math.max(1, Math.round(file.size / 1024))} KB · Listo para lectura</small></span><span>Válido</span>`;
      $("strong", row).textContent = file.name;
      list.appendChild(row);
    });
  };

  const downloadJSON = (kind = "frontend") => {
    const current = cases[activeCase];
    if (!current) {
      toast("No hay un expediente cargado desde el backend para exportar.");
      return;
    }
    const payload = {
      schema_version: "0.2.0",
      export_type: kind,
      invoice_id: current.invoiceId,
      invoice_number: current.invoice,
      business_status: current.businessState,
      active_role: currentRole,
      supplier: current.vendor,
      totals: {
        subtotal: current.docs.invoice.subtotal,
        iva: current.docs.invoice.iva,
        total: current.docs.invoice.total,
      },
      validation_summary: current.confidence,
      proposal: {
        status: current.proposalStatus,
        account_and_center: current.proposalAccount,
        authorized_base: current.proposalBase,
        difference: current.proposalDiff,
      },
      timeline: current.timeline,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = d.createElement("a");
    link.href = url;
    link.download = `contrato-${activeCase.toLowerCase()}-${kind}-v0.2.json`;
    d.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Archivo ${link.download} descargado.`);
  };

  let routeSpinnerTimer = null;

  const changeView = (view) => {
    const routeConfig = {
      resumen: {
        section: "Operación",
        kicker: "Trazabilidad completa",
        title: "Resumen",
        desc: "Revisa el avance general y la línea de tiempo paso a paso del expediente seleccionado.",
      },
      documentos: {
        section: "Operación",
        kicker: "Repositorio de evidencias",
        title: "Documentos",
        desc: "Consulta las facturas, órdenes de compra, contratos y actas asociadas a cada caso.",
      },
      revisiones: {
        section: "Operación",
        kicker: "Cola de causación",
        title: "Revisiones",
        desc: "El sistema verifica con reglas claras. Tú corriges, justificas y decides con respaldo documental.",
      },
      "visor-lmm": {
        section: "Operación",
        kicker: "Visor de respuestas Cloud LMM",
        title: "Visor LMM",
        desc: "Lectura editorial simplificada de los dictámenes de Cloud LMM para la causación contable.",
      },
      reglas: {
        section: "Operación",
        kicker: "Criterios de control financiero",
        title: "Reglas",
        desc: "Puntos de verificación organizados por dominio contable, tributario y comercial.",
      },
      auditoria: {
        section: "Administración",
        kicker: "Gobierno y control interno",
        title: "Auditoría",
        desc: "Consulta la trazabilidad detallada de cada causación, sus eventos y decisiones registradas.",
      },
      integraciones: {
        section: "Administración",
        kicker: "Arquitectura en 7 etapas",
        title: "Integraciones",
        desc: "Módulos conectados mediante contratos JSON claros y verificables.",
      },
      configuracion: {
        section: "Administración",
        kicker: "Alcance y permisos",
        title: "Configuración",
        desc: "Ajusta tu rol en la sesión, la política de tolerancia y las reglas de seguridad.",
      },
    };
    const currentRoute = routeConfig[view] || routeConfig.resumen;

    const routeSpinner = $("[data-route-spinner]");
    const routeSpinnerText = $("[data-route-spinner-label]");
    if (routeSpinner && !reducedMotion) {
      if (routeSpinnerText)
        routeSpinnerText.textContent = `Cargando ${currentRoute.title}...`;
      routeSpinner.classList.add("is-active");
      window.clearTimeout(routeSpinnerTimer);
      routeSpinnerTimer = window.setTimeout(() => {
        routeSpinner.classList.remove("is-active");
      }, 360);
    }

    if ($("[data-kicker]"))
      $("[data-kicker]").textContent = currentRoute.kicker;
    if ($("[data-breadcrumb-section]"))
      $("[data-breadcrumb-section]").textContent = currentRoute.section;
    if ($("[data-breadcrumb-kicker]"))
      $("[data-breadcrumb-kicker]").textContent = currentRoute.kicker;
    if ($("[data-breadcrumb-current]"))
      $("[data-breadcrumb-current]").textContent = currentRoute.title;
    if ($("[data-page-title]"))
      $("[data-page-title]").textContent = currentRoute.title;
    if ($("[data-page-description]"))
      $("[data-page-description]").textContent = currentRoute.desc;
    if ($("[data-breadcrumb]"))
      $("[data-breadcrumb]").textContent = currentRoute.title;
    const pageActions = $("[data-page-actions]");
    if (pageActions) {
      pageActions.style.display = view === "resumen" ? "flex" : "none";
    }
    const route =
      $(`[data-route-view="${view}"]`) || $('[data-route-view="resumen"]');
    $$("[data-route-view]").forEach((item) =>
      item.classList.toggle("is-visible", item === route),
    );
    if (canAnimate && route) {
      window.gsap.fromTo(
        $$(".route-reveal, .rule-group-card", route),
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.045,
          ease: "power2.out",
          clearProps: "all",
        },
      );
    }
    if (view === "resumen") {
      renderTraceTree(activeCase);
      animateResumenCharts();
    }
    if (view === "visor-lmm") {
      renderLmmViewer(activeCase, true);
      loadLmmFromApi(activeCase)
        .then(() => renderLmmViewer(activeCase, false))
        .catch((error) => console.warn("[ai-invoice-processor] LMM", error));
    }
    $$("[data-nav]").forEach((item) => {
      const isActive = item.dataset.nav === view;
      item.classList.toggle("is-active", isActive);
      if (isActive) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    $("[data-sidebar]")?.classList.remove("is-open");
    $(".sidebar-backdrop")?.classList.remove("is-visible");
  };

  const bind = () => {
    $$("[data-nav]").forEach((item) =>
      item.addEventListener("click", (event) => {
        event.preventDefault();
        changeView(item.dataset.nav);
        window.history.replaceState({}, "", `#${item.dataset.nav}`);
      }),
    );
    $$("[data-queue-list] .queue-row").forEach((row) =>
      row.addEventListener("click", () => setActiveCase(row.dataset.case)),
    );
    $$("[data-open-case]").forEach((button) =>
      button.addEventListener("click", () => {
        const targetCase = button.dataset.openCase;
        if (cases[targetCase]) setActiveCase(targetCase);
        changeView("revisiones");
        window.history.replaceState({}, "", "#revisiones");
        toast(`Expediente ${targetCase} abierto en Revisiones.`);
      }),
    );

    $$("[data-tree-select]").forEach((button) =>
      button.addEventListener("click", () => {
        const targetCase = button.dataset.treeSelect;
        if (cases[targetCase]) {
          setActiveCase(targetCase);
          toast(`Árbol de trazabilidad actualizado para ${targetCase}.`);
        }
      }),
    );

    $$("[data-bar-month]").forEach((button) =>
      button.addEventListener("click", () => {
        const stage = button.closest(".bar-chart__stage");
        if (!stage) return;
        $$("[data-bar-month]", stage).forEach((b) =>
          b.classList.toggle("is-selected", b === button),
        );
        const callout = $("[data-bar-callout]");
        if (callout) {
          callout.textContent = button.dataset.inv || "";
          button.prepend(callout);
          if (canAnimate) {
            window.gsap.fromTo(
              callout,
              { scale: 0.86, autoAlpha: 0.6 },
              { scale: 1, autoAlpha: 1, duration: 0.28, ease: "back.out(1.7)" },
            );
          }
        }
        if ($("[data-bar-month-label]"))
          $("[data-bar-month-label]").textContent =
            `${button.dataset.barMonth} 2026`;
        if ($("[data-bar-invoice-val]"))
          $("[data-bar-invoice-val]").textContent =
            `${button.dataset.inv} facturados`;
        if ($("[data-bar-order-val]"))
          $("[data-bar-order-val]").textContent =
            `${button.dataset.oc} en orden`;
        if ($("[data-bar-diff-val]")) {
          const diffEl = $("[data-bar-diff-val]");
          diffEl.textContent = button.dataset.diff || "";
          diffEl.classList.toggle(
            "text-warning",
            (button.dataset.diff || "").includes("+") ||
              (button.dataset.diff || "").includes("Pendiente"),
          );
        }
        const refCase = button.dataset.caseRef;
        if (refCase && cases[refCase]) {
          setActiveCase(refCase);
        }
      }),
    );
    $$("[data-filter]").forEach((button) =>
      button.addEventListener("click", () =>
        setFilter(button.dataset.filter, button),
      ),
    );
    $$("[data-period-option]").forEach((button) =>
      button.addEventListener("click", () => {
        activePeriod = button.dataset.periodOption;
        activeQueuePage = 1;
        updatePeriodTrigger();
        applyQueueFilters();
        closeAllModals();
      }),
    );
    $("[data-review-search]")?.addEventListener("input", () => {
      activeQueuePage = 1;
      applyQueueFilters();
    });
    $("[data-audit-search]")?.addEventListener("input", (event) => {
      auditQuery = event.target.value;
      auditHistoryPage = 1;
      applyAuditFilters();
    });
    $("[data-audit-history-list]")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-audit-case]");
      if (!button || !cases[button.dataset.auditCase]) return;
      setActiveCase(button.dataset.auditCase);
    });
    $$("[data-audit-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        activeAuditFilter = button.dataset.auditFilter;
        auditHistoryPage = 1;
        $$("[data-audit-filter]").forEach((chip) =>
          chip.classList.toggle("is-active", chip === button),
        );
        applyAuditFilters();
      }),
    );
    $("[data-audit-page-prev]")?.addEventListener("click", () => {
      if (auditHistoryPage <= 1) return;
      auditHistoryPage -= 1;
      applyAuditFilters();
    });
    $("[data-audit-page-next]")?.addEventListener("click", () => {
      auditHistoryPage += 1;
      applyAuditFilters();
    });
    $("[data-documents-page-prev]")?.addEventListener("click", () => {
      if (documentsPage <= 1) return;
      documentsPage -= 1;
      renderBackendDocuments();
    });
    $("[data-documents-page-next]")?.addEventListener("click", () => {
      documentsPage += 1;
      renderBackendDocuments();
    });
    $("[data-audit-open-lmm]")?.addEventListener("click", () => {
      changeView("visor-lmm");
      window.history.replaceState({}, "", "#visor-lmm");
      toast(`Dictamen de ${activeCase} abierto en Visor LMM.`);
    });
    $("[data-global-search]")?.addEventListener("input", (event) => {
      const target = $("[data-review-search]");
      if (target) {
        target.value = event.target.value;
        target.dispatchEvent(new Event("input"));
      }
    });
    $$("[data-sidebar-toggle]").forEach((button) =>
      button.addEventListener("click", () => {
        $("[data-sidebar]")?.classList.add("is-open");
        $(".sidebar-backdrop")?.classList.add("is-visible");
      }),
    );
    $$("[data-sidebar-close]").forEach((button) =>
      button.addEventListener("click", () => {
        $("[data-sidebar]")?.classList.remove("is-open");
        $(".sidebar-backdrop")?.classList.remove("is-visible");
      }),
    );
    $$("[data-open-upload]").forEach((button) =>
      button.addEventListener("click", openUploadModal),
    );
    $("[data-open-period-modal]")?.addEventListener("click", openPeriodModal);
    $("[data-close-period]")?.addEventListener("click", closeAllModals);
    $$("[data-close-upload],[data-close-action]").forEach((button) =>
      button.addEventListener("click", closeAllModals),
    );
    $("[data-modal-backdrop]")?.addEventListener("click", closeAllModals);
    d.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllModals();
    });
    updatePeriodTrigger();

    $$("[data-open-role],[data-switch-workspace]").forEach((button) =>
      button.addEventListener("click", () => openActionModal("role")),
    );
    $$("[data-open-action-modal]").forEach((button) =>
      button.addEventListener("click", () =>
        openActionModal(button.dataset.openActionModal),
      ),
    );
    $("[data-action-form]")?.addEventListener("submit", handleActionSubmit);

    $("[data-open-notifications]")?.addEventListener("click", () => {
      const targetCase = findCaseKeyByInvoice("FE-9001");
      if (targetCase) setActiveCase(targetCase);
      changeView("revisiones");
      toast(
        "Alerta prioritaria: FE-9001 presenta una diferencia del 4 % frente a su orden de compra.",
      );
    });

    $("[data-file-input]")?.addEventListener("change", (event) =>
      renderFiles(event.target.files),
    );
    const dropzone = $("[data-dropzone]");
    if (dropzone) {
      ["dragenter", "dragover"].forEach((eventName) =>
        dropzone.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropzone.classList.add("is-dragging");
        }),
      );
      ["dragleave", "drop"].forEach((eventName) =>
        dropzone.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropzone.classList.remove("is-dragging");
        }),
      );
      dropzone.addEventListener("drop", (event) =>
        renderFiles(event.dataTransfer.files),
      );
    }
    $("[data-process-files]")?.addEventListener("click", () => {
      const files = $("[data-file-input]")?.files;
      const firstName = files?.[0]?.name || "factura_nueva.pdf";
      if (window.NepxaApi && files?.[0]) {
        const processButton = $("[data-process-files]");
        if (processButton) processButton.disabled = true;
        window.NepxaApi.uploadInvoice(files[0])
          .then(async (result) => {
            const detail = await window.NepxaApi.processCase(result.invoice_id);
            const invoice = detail.invoice;
            const caseId = invoice.number
              ? `${invoice.prefix ? `${invoice.prefix}-` : ""}${invoice.number}`
              : result.invoice_id;
            hydrateCaseFromApi(caseId, detail);
            window.NepxaApi.getSummary()
              .then(hydrateSummaryFromApi)
              .catch(() => hydrateInventoryFromBackend());
            renderBackendQueue();
            renderBackendDocuments();
            renderBackendLmmHistory();
            renderBackendTreeCases();
            closeAllModals();
            setActiveCase(caseId);
            applyQueueFilters();
            toast(`Expediente ${caseId} cargado en el Backend.`);
          })
          .catch((error) => toast(error.message || "No se pudo cargar el documento."))
          .finally(() => {
            if (processButton) processButton.disabled = false;
          });
        return;
      }
      toast("No se pudo conectar al backend; el documento no se registró.");
    });

    $("[data-export]")?.addEventListener("click", () =>
      downloadJSON("expediente"),
    );
    $$("[data-connect]").forEach((button) =>
      button.addEventListener("click", () =>
        downloadJSON(button.dataset.connect || "contrato"),
      ),
    );
    $("[data-dismiss-demo]")?.addEventListener("click", (event) =>
      event.currentTarget.closest(".demo-banner")?.remove(),
    );

    $("[data-request-review]")?.addEventListener("click", () => {
      const current = cases[activeCase];
      if (!current) return;
      if (current.secondaryActionType === "view_original") {
        const originalCase = findCaseKeyByInvoice("FE-1001");
        if (originalCase) setActiveCase(originalCase);
        toast("Mostrando el expediente original conciliado.");
        return;
      }
      openActionModal(current.secondaryActionType || "authorize");
    });

    $("[data-view-audit]")?.addEventListener("click", () => {
      changeView("resumen");
      window.history.replaceState({}, "", "#resumen");
      toast(`Mostrando la línea de tiempo completa de ${activeCase}.`);
    });

    $$("[data-route-action]").forEach((button) =>
      button.addEventListener("click", () =>
        changeView(button.dataset.routeAction),
      ),
    );
    $$("[data-new-rule]").forEach((button) =>
      button.addEventListener("click", () =>
        toast(
          "Política activa: precisión decimal exacta y tolerancia de 1 COP solo para redondeo aritmético.",
        ),
      ),
    );
    $$("[data-save-settings]").forEach((button) =>
      button.addEventListener("click", () => {
        const selectedRole = $("[data-setting-role]")?.value;
        if (selectedRole && roleProfiles[selectedRole]) {
          currentRole = selectedRole;
          applyRoleUI();
        }
        toast("Configuración y rol activo actualizados.");
      }),
    );

    $$("[data-rule-toggle]").forEach((button) =>
      button.addEventListener("click", () => {
        const active = button.classList.toggle("is-on");
        button.setAttribute("aria-pressed", String(active));
        const label = $("span", button);
        if (label) label.textContent = active ? "Activo" : "En revisión";
        const pointItem = button.closest(".rule-point-item");
        const dot = pointItem ? $(".rule-point-dot", pointItem) : null;
        if (dot) {
          dot.classList.toggle("rule-point-dot--green", active);
          dot.classList.toggle("rule-point-dot--amber", !active);
        }
        toast(
          active
            ? "Punto de control activado en el motor."
            : "Punto marcado como no evaluado: se informará sin bloquear en silencio.",
        );
      }),
    );

    $("[data-page-prev]")?.addEventListener("click", () => {
      if (activeQueuePage > 1) {
        activeQueuePage -= 1;
        applyQueueFilters();
      }
    });
    $("[data-page-next]")?.addEventListener("click", () => {
      activeQueuePage += 1;
      applyQueueFilters();
    });

    $("[data-scroll-support]")?.addEventListener("click", () => {
      const purchaseTab = $('[data-tab="purchase"]');
      if (purchaseTab) purchaseTab.click();
      runInlineLmmStream(activeCase);
    });

    $$("[data-open-lmm-viewer]").forEach((button) =>
      button.addEventListener("click", () => {
        loadLmmFromApi(activeCase)
          .catch((error) => toast(error.message || "No se pudo consultar el análisis LMM."))
          .finally(() => {
            changeView("visor-lmm");
            window.history.replaceState({}, "", "#visor-lmm");
            toast(`Abriendo dictamen de ${activeCase} en el historial del Visor LMM.`);
          });
      }),
    );

    $$("[data-lmm-case]").forEach((button) =>
      button.addEventListener("click", () => {
        const targetCase = button.dataset.lmmCase;
        if (cases[targetCase]) {
          activeCase = targetCase;
          setActiveCase(targetCase);
          renderLmmViewer(targetCase, true);
        }
      }),
    );

    $$("[data-lmm-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        lmmHistoryFilter = button.dataset.lmmFilter || "all";
        lmmHistoryPage = 1;
        renderBackendLmmHistory();
      }),
    );

    $("[data-lmm-search]")?.addEventListener("input", (event) => {
      lmmHistoryQuery = String(event.currentTarget.value || "").trim().toLowerCase();
      lmmHistoryPage = 1;
      renderBackendLmmHistory();
    });

    $("[data-lmm-page-prev]")?.addEventListener("click", () => {
      if (lmmHistoryPage <= 1) return;
      lmmHistoryPage -= 1;
      renderBackendLmmHistory();
    });

    $("[data-lmm-page-next]")?.addEventListener("click", () => {
      lmmHistoryPage += 1;
      renderBackendLmmHistory();
    });

    $("[data-approve]")?.addEventListener("click", () => {
      const current = cases[activeCase];
      const role = roleProfiles[currentRole];
      if (!current) return;
      if (!role.canApprove) {
        toast(
          "Tu rol actual no puede aprobar propuestas. Cambia al perfil de Aprobadora autorizada.",
        );
        return;
      }
      if (current.proposalPill !== "pill--ready") {
        openActionModal(current.secondaryActionType || "authorize");
        toast(
          "Antes de aprobar debes resolver o autorizar la alerta pendiente con respaldo.",
        );
        return;
      }
      if (window.NepxaApi && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(current.invoiceId || "")) {
        const caseId = activeCase;
        window.NepxaApi.runAction(current.invoiceId, "approve_proposal", {
          reason: "Aprobación registrada desde Revisiones.",
          actor_name: role.name,
        }).then((payload) => {
          refreshCaseAfterAction(caseId, payload);
          toast("Propuesta aprobada y registrada en Auditoría.");
        }).catch((error) => toast(error.message || "No se pudo aprobar la propuesta."));
        return;
      }
      const time = nowTime();
      const row = $(`[data-case="${activeCase}"]`);
      if (row) {
        row.dataset.status = "ready";
        $(".status", row).className = "queue-row__status status status--ready";
      }
      current.status = "ready";
      current.businessState = "APROBADA";
      current.statusLabel = "Aprobada";
      current.proposalStatus = "Aprobada (Sin pago automático)";
      current.proposalPill = "pill--ready";
      current.primaryAction =
        'Propuesta aprobada <span aria-hidden="true">✓</span>';
      current.timeline.push({
        dot: "green",
        time: `${time} · Propuesta aprobada por ${role.name}`,
        detail:
          "Decisión humana registrada con permisos verificados. No implica desembolso automático.",
        tag: "Aprobada",
      });
      current.audit = `<strong>Historial actualizado (${activeCase}):</strong> Propuesta aprobada por ${role.name} a las ${time} (queda lista para el sistema contable).`;
      setActiveCase(activeCase);
      toast(
        `${activeCase} aprobada por ${role.name}. Evento registrado en la línea de tiempo.`,
      );
      applyQueueFilters();
    });

    $$("[data-tab]").forEach((tab) =>
      tab.addEventListener("click", () => {
        const targetIdx = DOC_KEYS.indexOf(tab.dataset.tab);
        const curIdx = DOC_KEYS.indexOf(activeTab);
        switchDocTab(tab.dataset.tab, targetIdx >= curIdx ? 1 : -1);
      }),
    );

    $$("[data-doc-prev]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateDocByDelta(-1);
      }),
    );
    $$("[data-doc-next]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateDocByDelta(1);
      }),
    );

    d.addEventListener("keydown", (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(d.activeElement?.tagName))
        return;
      const view = $('[data-route-view="revisiones"]');
      if (!view || !view.classList.contains("is-visible")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateDocByDelta(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateDocByDelta(1);
      }
    });

    $("[data-zoom-in]")?.addEventListener("click", () => {
      zoomLevel = Math.min(115, zoomLevel + 10);
      if ($("[data-zoom-label]"))
        $("[data-zoom-label]").textContent = `${zoomLevel}%`;
      if ($("[data-invoice-sheet]"))
        $("[data-invoice-sheet]").style.zoom = `${zoomLevel}%`;
    });
    $("[data-zoom-out]")?.addEventListener("click", () => {
      zoomLevel = Math.max(85, zoomLevel - 10);
      if ($("[data-zoom-label]"))
        $("[data-zoom-label]").textContent = `${zoomLevel}%`;
      if ($("[data-invoice-sheet]"))
        $("[data-invoice-sheet]").style.zoom = `${zoomLevel}%`;
    });
    $("[data-zoom-fit]")?.addEventListener("click", () => {
      zoomLevel = 100;
      if ($("[data-zoom-label]")) $("[data-zoom-label]").textContent = "100%";
      if ($("[data-invoice-sheet]"))
        $("[data-invoice-sheet]").style.zoom = "100%";
    });
    $("[data-zoom-in]")?.addEventListener("click", updatePdfFrameZoom);
    $("[data-zoom-out]")?.addEventListener("click", updatePdfFrameZoom);
    $("[data-zoom-fit]")?.addEventListener("click", updatePdfFrameZoom);
    $("[data-download-doc]")?.addEventListener("click", () => {
      const url = $("[data-download-doc]")?.dataset.documentUrl;
      if (url) {
        const link = d.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        link.click();
        return;
      }
      downloadJSON(`documento-${activeTab}`);
    });
  };

  safe(() => {
    bind();
    clearBackendViews();
    applyRoleUI();
    renderAuditHistoryWorkspace(activeCase);
    applyQueueFilters();
    const initialView = window.location.hash.slice(1);
    const normalizedInitialView = initialView;
    if (normalizedInitialView && $('[data-route-view="' + normalizedInitialView + '"]'))
      changeView(normalizedInitialView);
    else {
      changeView("resumen");
    }
    if (!normalizedInitialView && canAnimate)
      window.gsap.fromTo(
        $$(".route-reveal", $('[data-route-view="resumen"]')),
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "all",
        },
      );
    hydrateWorkspaceFromApi().catch((error) => {
      console.warn("[ai-invoice-processor] Backend no disponible", error);
      clearBackendViews();
      finishWorkspaceTransition();
      toast("Backend no disponible: no se muestran datos simulados.");
    });
  });
})();
