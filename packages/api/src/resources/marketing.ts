// packages/api/src/resources/marketing.ts
import type { Http } from "../http";

export interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateKey?: string;
  metadata?: Record<string, any>;
  category: "transactional" | "marketing";
}

export interface SendEmailResponse {
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

export function makeMarketing(http: Http) {
  return {
    email: {
      async send(params: SendEmailRequest): Promise<SendEmailResponse> {
        return http.post("/marketing/email/send", params);
      },
    },
  };
}

export type MarketingResource = ReturnType<typeof makeMarketing>;
