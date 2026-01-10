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
import { makeTags, type TagsResource } from "./resources/tags";
import { makePartyCrm, type PartyCrmResource } from "./resources/party-crm";
import { makeTemplates, type TemplatesResource } from "./resources/templates";
import { makeCommunications, type CommunicationsResource } from "./resources/communications";
import { makeDrafts, type DraftsResource } from "./resources/drafts";
import { makeDocumentBundles, type DocumentBundlesResource } from "./resources/document-bundles";
import { makeAnimalLinking, type AnimalLinkingResource } from "./resources/animal-linking";

export { createHttp, type Http, type MakeAuthHeader } from "./http";

// Re-export resource factories + their types
export { makeContacts, type ContactsResource } from "./resources/contacts";
export { makeAnimals } from "./resources/animals";
export { makeBreeding } from "./resources/breeding";
export { makeOffspring } from "./resources/offspring";
export { makeFinance, type FinanceResource, type InvoicesResource, type PaymentsResource, type ExpensesResource, type PartiesResource, type PartySearchResult, type FinanceContactsResource, type FinanceOrganizationsResource } from "./resources/finance";
export { makeMarketing, type MarketingResource } from "./resources/marketing";
export { makeMessages, type MessagesResource, type MessageThread, type Message, type MessageParticipant, type UpdateThreadRequest } from "./resources/messages";
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
export {
  makeTags,
  type TagsResource,
  type TagModule,
  type TagDTO,
  type TagListParams,
  type TagListResponse,
  type CreateTagInput,
  type UpdateTagInput,
  type TagAssignmentTarget,
} from "./resources/tags";
export {
  makePartyCrm,
  makePartyNotes,
  makePartyActivity,
  makePartyEmails,
  makePartyEvents,
  makePartyMilestones,
  makeContactTasks,
  type PartyCrmResource,
  type PartyNotesResource,
  type PartyActivityResource,
  type PartyEmailsResource,
  type PartyEventsResource,
  type PartyMilestonesResource,
  type ContactTasksResource,
} from "./resources/party-crm";
export {
  makeTemplates,
  type TemplatesResource,
} from "./resources/templates";
export {
  makeCommunications,
  type CommunicationsResource,
  type CommunicationItem,
  type CommunicationChannel,
  type CommunicationStatus,
  type CommunicationType,
  type CommunicationSort,
  type BulkAction,
  type InboxParams,
  type InboxResponse,
  type BulkActionRequest,
  type BulkActionResponse,
  type InboxCounts,
} from "./resources/communications";
export {
  makeDrafts,
  type DraftsResource,
  type Draft,
  type DraftChannel,
  type DraftListParams,
  type DraftListResponse,
  type CreateDraftRequest,
  type UpdateDraftRequest,
  type SendDraftResponse,
} from "./resources/drafts";
export {
  makeDocumentBundles,
  type DocumentBundlesResource,
} from "./resources/document-bundles";
export {
  makeAnimalLinking,
  type AnimalLinkingResource,
} from "./resources/animal-linking";

// Re-export shared types - common types first (ID, ListParams, ListResponse)
export * from "./types/contacts";
export * from "./types/animals";
export * from "./types/document-bundles";
export * from "./types/breeding";
export * from "./types/offspring";
export * from "./types/party";
export * from "./types/party-crm";
export * from "./types/templates";
export * from "./types/animal-linking";
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
    tags:      makeTags(http),
    partyCrm:  makePartyCrm(http),
    templates: makeTemplates(http),
    communications: makeCommunications(http),
    drafts: makeDrafts(http),
    documentBundles: makeDocumentBundles(http),
    animalLinking: makeAnimalLinking(http),
  };
}
