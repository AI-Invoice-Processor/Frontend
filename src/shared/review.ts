import type { HumanReviewAction, HumanReviewEvent, Invoice } from "./types";

const storageKey = "ai-invoice-processor:human-reviews";

type ReviewStore = Record<string, HumanReviewEvent[]>;

function readStore(): ReviewStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as ReviewStore;
  } catch {
    return {};
  }
}

function writeStore(store: ReviewStore) {
  if (typeof window !== "undefined")
    localStorage.setItem(storageKey, JSON.stringify(store));
}

export const reviewApi = {
  async list(invoiceId: string): Promise<HumanReviewEvent[]> {
    return readStore()[invoiceId] ?? [];
  },
  async record(
    invoiceId: string,
    action: HumanReviewAction,
    observation: string,
  ): Promise<HumanReviewEvent> {
    const event: HumanReviewEvent = {
      id: `review-${Date.now()}`,
      action,
      observation: observation.trim(),
      status: "simulada",
      createdAt: new Date().toISOString(),
    };
    const store = readStore();
    store[invoiceId] = [...(store[invoiceId] ?? []), event];
    writeStore(store);
    return event;
  },
};

export function applyReviewState(
  invoice: Invoice,
  history: HumanReviewEvent[],
) {
  if (!history.length) return invoice;
  return {
    ...invoice,
    reviewStatus: "revisada" as const,
    humanReview: {
      ...invoice.humanReview,
      status: "completada" as const,
      history,
    },
  };
}
