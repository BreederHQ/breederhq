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

// (Optional) re-export shared types if you keep them under src/types/*
export * from "./types/contacts";
export * from "./types/animals";
export * from "./types/breeding";
export * from "./types/offspring";
export * from "./types/party";
export * from "./types/finance";

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
  };
}
