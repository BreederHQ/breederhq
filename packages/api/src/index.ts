// packages/api/src/index.ts
// Public entry for @bhq/api (frontend SDK). Env-agnostic: apps inject baseURL + auth.

import { createHttp, type MakeAuthHeader } from "./http";
import { makeContacts, type ContactsResource } from "./resources/contacts";
import { makeAnimals } from "./resources/animals";
import { makeBreeding } from "./resources/breeding";
import { makeOffspring } from "./resources/offspring";
import { makeFinance, type FinanceResource } from "./resources/finance";
import { makeMarketing, type MarketingResource } from "./resources/marketing";
import { makeMessages, type MessagesResource } from "./resources/messages";
import { makePortalAccess, type PortalAccessResource } from "./resources/portal-access";
import { makePortalData, type PortalDataResource } from "./resources/portal-data";

export { createHttp, type Http, type MakeAuthHeader } from "./http";

// Re-export resource factories + their types
export { makeContacts, type ContactsResource } from "./resources/contacts";
export { makeAnimals } from "./resources/animals";
export { makeBreeding } from "./resources/breeding";
export { makeOffspring } from "./resources/offspring";
export { makeFinance, type FinanceResource, type InvoicesResource, type PaymentsResource, type ExpensesResource } from "./resources/finance";
export { makeMarketing, type MarketingResource } from "./resources/marketing";
export { makeMessages, type MessagesResource } from "./resources/messages";
export { makePortalAccess, type PortalAccessResource, type PortalAccessDTO, type PortalAccessStatus, type PortalAccessResponse } from "./resources/portal-access";
export {
  makePortalData,
  type PortalDataResource,
  type ContractStatus,
  type ContractPartyRole,
  type AgreementDTO,
  type AgreementsResponse,
  type AgreementPartyDTO,
  type AgreementDetailDTO,
  type AgreementDetailResponse,
  type DocumentCategory,
  type DocumentSource,
  type DocumentDTO,
  type DocumentsResponse,
  type PlacementStatus,
  type OffspringPlacementDTO,
  type OffspringPlacementsResponse,
  type OffspringDetailDTO,
  type OffspringDetailResponse,
} from "./resources/portal-data";

// Re-export shared types - common types first (ID, ListParams, ListResponse)
export * from "./types/contacts";
export * from "./types/animals";
export * from "./types/breeding";
export * from "./types/offspring";
export * from "./types/party";
export {
  type LineItemKind,
  type InvoiceCategory,
  type InvoiceLineItemDTO,
  type CreateLineItemInput,
  type InvoiceStatus,
  type InvoiceDTO,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type PaymentMethodType,
  type PaymentDTO,
  type CreatePaymentInput,
  type ExpenseCategory,
  type ExpenseDTO,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type IdempotencyHeaders,
  generateIdempotencyKey,
} from "./types/finance";

export function makeApi(baseURL: string, makeAuth?: MakeAuthHeader) {
  const http = createHttp(baseURL, makeAuth);
  return {
    http,                       // raw client if you need it
    contacts:  makeContacts(http),
    animals:   makeAnimals(http),
    breeding:  makeBreeding(http),
    offspring: makeOffspring(http),
    finance:   makeFinance(http),
    marketing: makeMarketing(http),
    messages:  makeMessages(http),
    portalAccess: makePortalAccess(http),
    portalData: makePortalData(http),
  };
}
