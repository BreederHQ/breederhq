// packages/ui/src/legal/index.ts
// Re-export legal utilities and configuration

export {
  CURRENT_TOS_VERSION,
  TOS_EFFECTIVE_DATE,
  TOS_EFFECTIVE_DATE_DISPLAY,
  needsTosAcceptance,
  createTosAcceptancePayload,
} from "./config";

export type {
  TosAcceptanceRecord,
  TosAcceptancePayload,
  TosAcceptanceSurface,
  TosAcceptanceFlow,
} from "./config";
