// packages/api/src/index.ts
// Public entry for @bhq/api (frontend SDK). Env-agnostic: apps inject baseURL + auth.

import { createHttp, type MakeAuthHeader } from "./http";
import { makeContacts, type ContactsResource } from "./resources/contacts";
import { makeAnimals } from "./resources/animals";
import { makeBreeding } from "./resources/breeding";
import { makeOffspring } from "./resources/offspring";
import { makeFinance, type FinanceResource } from "./resources/finance";

export { createHttp, type Http, type MakeAuthHeader } from "./http";

// Re-export resource factories + their types
export { makeContacts, type ContactsResource } from "./resources/contacts";
export { makeAnimals } from "./resources/animals";
export { makeBreeding } from "./resources/breeding";
export { makeOffspring } from "./resources/offspring";
export { makeFinance, type FinanceResource, type InvoicesResource, type PaymentsResource, type ExpensesResource } from "./resources/finance";

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
  };
}
