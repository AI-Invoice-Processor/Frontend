import { invoiceFixtures } from "../mocks/fixtures";
import type { ApiError, Invoice } from "./types";
import { applyReviewState, reviewApi } from "./review";
export interface InvoiceListParams {
  query?: string;
  reviewStatus?: string;
}
export interface InvoiceApi {
  list(params?: InvoiceListParams): Promise<Invoice[]>;
  get(id: string): Promise<Invoice>;
  upload(file: File): Promise<Invoice>;
}
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
export const mockApi: InvoiceApi = {
  async list(params = {}) {
    await wait();
    if (params.query?.toLowerCase() === "error")
      throw {
        code: "MOCK_QUERY_ERROR",
        message: "No fue posible consultar la bandeja de demostración.",
      } satisfies ApiError;
    const hydrated = await Promise.all(
      invoiceFixtures.map(async (invoice) =>
        applyReviewState(invoice, await reviewApi.list(invoice.id)),
      ),
    );
    return hydrated.filter(
      (invoice) =>
        (!params.query ||
          `${invoice.invoiceNumber} ${invoice.supplier.name} ${invoice.supplier.nit}`
            .toLowerCase()
            .includes(params.query.toLowerCase())) &&
        (!params.reviewStatus ||
          params.reviewStatus === "todos" ||
          invoice.reviewStatus === params.reviewStatus),
    );
  },
  async get(id) {
    await wait();
    const invoice = invoiceFixtures.find((item) => item.id === id);
    if (!invoice)
      throw {
        code: "NOT_FOUND",
        message: "Factura no encontrada en el conjunto sintético.",
      } satisfies ApiError;
    return applyReviewState(invoice, await reviewApi.list(invoice.id));
  },
  async upload() {
    await wait(700);
    return invoiceFixtures[0];
  },
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  if (!response.ok) {
    let details: string | undefined;
    try {
      const body = (await response.json()) as {
        message?: string;
        details?: string;
      };
      details = body.details ?? body.message;
    } catch {
      details = undefined;
    }
    throw {
      code: `HTTP_${response.status}`,
      message: "La API no pudo completar la solicitud.",
      details,
    } satisfies ApiError;
  }
  return (await response.json()) as T;
}
const restApi: InvoiceApi = {
  list: (params = {}) => {
    const search = new URLSearchParams();
    if (params.query) search.set("query", params.query);
    if (params.reviewStatus && params.reviewStatus !== "todos")
      search.set("reviewStatus", params.reviewStatus);
    return request<Invoice[]>(
      `/api/invoices${search.size ? `?${search}` : ""}`,
    );
  },
  get: (id) => request<Invoice>(`/api/invoices/${encodeURIComponent(id)}`),
  upload: (file) => {
    const body = new FormData();
    body.append("file", file, file.name);
    return request<Invoice>("/api/invoices", { method: "POST", body });
  },
};
export const isDemoMode = import.meta.env.VITE_DATA_MODE !== "api";
export const invoiceApi: InvoiceApi = isDemoMode ? mockApi : restApi;
