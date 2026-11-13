(() => {
  "use strict";

  const configured = window.NEPXA_CONFIG || {};
  const baseUrl = String(configured.API_BASE_URL || "http://localhost:8000")
    .replace(/\/+$/, "");

  const request = async (path, options = {}) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeout || 15000);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(options.headers || {}),
        },
      });
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      if (!response.ok) {
        const message = payload?.error?.message || payload?.detail || "No se pudo completar la solicitud.";
        throw new Error(message);
      }
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  window.NepxaApi = {
    baseUrl,
    listCases: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") query.set(key, value);
      });
      return request(`/api/workspace/cases${query.toString() ? `?${query}` : ""}`);
    },
    getSummary: () => request("/api/workspace/summary"),
    processCase: (invoiceId) => request(`/api/workspace/cases/${encodeURIComponent(invoiceId)}/pipeline`, { method: "POST" }),
    processAll: () => request("/api/workspace/pipeline", { method: "POST", timeout: 120000 }),
    getCase: (invoiceId) => request(`/api/workspace/cases/${encodeURIComponent(invoiceId)}`),
    getDocumentUrl: (invoiceId, documentId) =>
      `${baseUrl}/api/workspace/cases/${encodeURIComponent(invoiceId)}/documents/${encodeURIComponent(documentId)}/content`,
    runAction: (invoiceId, action, payload = {}) =>
      request(`/api/workspace/cases/${encodeURIComponent(invoiceId)}/actions`, {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
      }),
    uploadInvoice: (file) => {
      const body = new FormData();
      body.append("file", file);
      return request("/api/invoices", { method: "POST", body });
    },
    getProposal: (invoiceId) => request(`/api/invoices/${encodeURIComponent(invoiceId)}/proposals`),
    generateProposal: (invoiceId) => request(`/api/invoices/${encodeURIComponent(invoiceId)}/proposals`, { method: "POST" }),
  };
})();
