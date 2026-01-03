// Finance resources — invoices, payments, and expenses
// Uses relative paths so createHttp(baseURL) applies.
// Normalizes list payloads into { items, total } to keep app code stable.

import type { Http } from "../http";
import type {
  InvoiceDTO,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  PaymentDTO,
  CreatePaymentInput,
  ExpenseDTO,
  CreateExpenseInput,
  UpdateExpenseInput,
  ListParams,
  ListResponse,
  ID,
  IdempotencyHeaders,
} from "../types/finance";

export type InvoicesResource = {
  list(params?: ListParams): Promise<ListResponse<InvoiceDTO>>;
  get(id: ID): Promise<InvoiceDTO>;
  create(input: CreateInvoiceInput, idempotencyKey: string): Promise<InvoiceDTO>;
  update(id: ID, input: UpdateInvoiceInput): Promise<InvoiceDTO>;
  void(id: ID): Promise<InvoiceDTO>;
};

export type PaymentsResource = {
  list(params?: ListParams): Promise<ListResponse<PaymentDTO>>;
  get(id: ID): Promise<PaymentDTO>;
  create(input: CreatePaymentInput, idempotencyKey: string): Promise<PaymentDTO>;
  export(filters?: any): Promise<ListResponse<any>>;
};

export type ExpensesResource = {
  list(params?: ListParams): Promise<ListResponse<ExpenseDTO>>;
  get(id: ID): Promise<ExpenseDTO>;
  create(input: CreateExpenseInput): Promise<ExpenseDTO>;
  update(id: ID, input: UpdateExpenseInput): Promise<ExpenseDTO>;
  delete(id: ID): Promise<{ success: true }>;
};

export type PartySearchResult = {
  partyId: number;
  party_id?: number;
  id?: number;
  displayName?: string;
  organizationName?: string;
  email?: string;
};

export type PartiesResource = {
  search(query: string, options?: { limit?: number }): Promise<PartySearchResult[]>;
};

export type ContactCreateInput = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  phone_e164?: string;
};

export type ContactCreateResult = {
  partyId?: number;
  party_id?: number;
  id?: number;
  display_name?: string;
  email?: string;
};

export type FinanceContactsResource = {
  create(input: ContactCreateInput): Promise<ContactCreateResult>;
};

export type OrganizationCreateInput = {
  name: string;
  website?: string | null;
};

export type OrganizationCreateResult = {
  partyId?: number;
  party_id?: number;
  id?: number;
  name?: string;
};

export type FinanceOrganizationsResource = {
  create(input: OrganizationCreateInput): Promise<OrganizationCreateResult>;
};

export type FinanceSummary = {
  outstandingTotalCents: number;
  invoicedMtdCents: number;
  collectedMtdCents: number;
  expensesMtdCents: number;
  depositsOutstandingCents: number;
};

export type FinanceResource = {
  invoices: InvoicesResource;
  payments: PaymentsResource;
  expenses: ExpensesResource;
  parties: PartiesResource;
  contacts: FinanceContactsResource;
  organizations: FinanceOrganizationsResource;
  summary(): Promise<FinanceSummary>;
};

// ─────────────────── HELPERS ───────────────────

function buildQuery(params: ListParams = {}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", String(params.q));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.sort) sp.set("sort", String(params.sort));

  // Flatten simple filters if present
  if (params.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v === undefined || v === null || v === "") continue;
      sp.set(k, String(v));
    }
  }

  const s = sp.toString();
  return s ? `?${s}` : "";
}

function normalizeList<T>(res: any): ListResponse<T> {
  // Server may return bare array
  if (Array.isArray(res)) {
    return { items: res as T[], total: (res as any[]).length };
  }

  // Common envelopes
  if (res && typeof res === "object") {
    // { items, total }
    if ("items" in res && "total" in res) {
      return res as ListResponse<T>;
    }
    // { results, total? }
    if ("results" in res) {
      const items = (res as any).results as T[];
      const total = Number((res as any).total ?? (Array.isArray(items) ? items.length : 0));
      return { items, total };
    }
    // { data: [...] } or { data: { items, total } }
    if ("data" in res) {
      const data = (res as any).data;
      if (Array.isArray(data)) {
        return {
          items: data as T[],
          total: Number((res as any).total ?? (res as any).count ?? data.length),
        };
      }
      if (data && typeof data === "object" && "items" in data) {
        const items = (data as any).items as T[];
        const total = Number(
          (data as any).total ??
            (data as any).count ??
            (Array.isArray(items) ? items.length : 0)
        );
        return { items, total };
      }
    }
  }

  return { items: [], total: 0 };
}

// ─────────────────── INVOICES ───────────────────

function makeInvoices(http: Http): InvoicesResource {
  return {
    async list(params: ListParams = {}): Promise<ListResponse<InvoiceDTO>> {
      const res = await http.get(`/api/v1/invoices${buildQuery(params)}`);
      return normalizeList<InvoiceDTO>(res);
    },

    async get(id: ID): Promise<InvoiceDTO> {
      return http.get(`/api/v1/invoices/${id}`);
    },

    async create(input: CreateInvoiceInput, idempotencyKey: string): Promise<InvoiceDTO> {
      const headers: IdempotencyHeaders = { "Idempotency-Key": idempotencyKey };
      return http.post(`/api/v1/invoices`, input, { headers });
    },

    async update(id: ID, input: UpdateInvoiceInput): Promise<InvoiceDTO> {
      return http.patch(`/api/v1/invoices/${id}`, input);
    },

    async void(id: ID): Promise<InvoiceDTO> {
      return http.post(`/api/v1/invoices/${id}/void`);
    },
  };
}

// ─────────────────── PAYMENTS ───────────────────

function makePayments(http: Http): PaymentsResource {
  return {
    async list(params: ListParams = {}): Promise<ListResponse<PaymentDTO>> {
      const res = await http.get(`/api/v1/payments${buildQuery(params)}`);
      return normalizeList<PaymentDTO>(res);
    },

    async get(id: ID): Promise<PaymentDTO> {
      return http.get(`/api/v1/payments/${id}`);
    },

    async create(input: CreatePaymentInput, idempotencyKey: string): Promise<PaymentDTO> {
      const headers: IdempotencyHeaders = { "Idempotency-Key": idempotencyKey };
      return http.post(`/api/v1/payments`, input, { headers });
    },

    async export(filters?: any): Promise<ListResponse<any>> {
      const res = await http.post(`/api/v1/finance/payments/export`, filters || {});
      return normalizeList<any>(res);
    },
  };
}

// ─────────────────── EXPENSES ───────────────────

function makeExpenses(http: Http): ExpensesResource {
  return {
    async list(params: ListParams = {}): Promise<ListResponse<ExpenseDTO>> {
      const res = await http.get(`/api/v1/expenses${buildQuery(params)}`);
      return normalizeList<ExpenseDTO>(res);
    },

    async get(id: ID): Promise<ExpenseDTO> {
      return http.get(`/api/v1/expenses/${id}`);
    },

    async create(input: CreateExpenseInput): Promise<ExpenseDTO> {
      return http.post(`/api/v1/expenses`, input);
    },

    async update(id: ID, input: UpdateExpenseInput): Promise<ExpenseDTO> {
      return http.patch(`/api/v1/expenses/${id}`, input);
    },

    async delete(id: ID): Promise<{ success: true }> {
      await http.delete(`/api/v1/expenses/${id}`);
      return { success: true };
    },
  };
}

// ─────────────────── PARTIES ───────────────────

function makeParties(http: Http): PartiesResource {
  return {
    async search(query: string, options?: { limit?: number }): Promise<PartySearchResult[]> {
      const sp = new URLSearchParams();
      sp.set("q", query);
      if (options?.limit != null) sp.set("limit", String(options.limit));
      const res = await http.get(`/api/v1/parties?${sp.toString()}`);
      // Handle various response shapes
      if (Array.isArray(res)) return res;
      if (res && typeof res === "object") {
        if ("items" in res) return res.items;
        if ("results" in res) return res.results;
        if ("data" in res && Array.isArray(res.data)) return res.data;
      }
      return [];
    },
  };
}

// ─────────────────── FINANCE CONTACTS ───────────────────

function makeFinanceContacts(http: Http): FinanceContactsResource {
  return {
    async create(input: ContactCreateInput): Promise<ContactCreateResult> {
      return http.post(`/api/v1/contacts`, input);
    },
  };
}

// ─────────────────── FINANCE ORGANIZATIONS ───────────────────

function makeFinanceOrganizations(http: Http): FinanceOrganizationsResource {
  return {
    async create(input: OrganizationCreateInput): Promise<OrganizationCreateResult> {
      return http.post(`/api/v1/organizations`, input);
    },
  };
}

// ─────────────────── MAIN FACTORY ───────────────────

export function makeFinance(http: Http): FinanceResource {
  return {
    invoices: makeInvoices(http),
    payments: makePayments(http),
    expenses: makeExpenses(http),
    parties: makeParties(http),
    contacts: makeFinanceContacts(http),
    organizations: makeFinanceOrganizations(http),

    async summary(): Promise<FinanceSummary> {
      return http.get(`/api/v1/finance/summary`);
    },
  };
}
