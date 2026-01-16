// tests/e2e/helpers/email-helpers.ts
// Email capture and verification helpers for E2E tests

import { expect } from '@playwright/test';

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  timestamp: Date;
}

/**
 * Mock email server for capturing emails during tests
 * In production, this would integrate with a service like MailHog or smtp4dev
 */
class EmailCapture {
  private messages: EmailMessage[] = [];
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:8025') {
    this.baseUrl = baseUrl;
  }

  /**
   * Clears all captured emails
   */
  async clear(): Promise<void> {
    this.messages = [];

    // Clear MailHog/smtp4dev messages via API
    try {
      await fetch(`${this.baseUrl}/api/v1/messages`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Could not clear email server:', err);
    }
  }

  /**
   * Fetches all messages from email server
   */
  async fetchMessages(): Promise<EmailMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/messages`);
      const data = await response.json();

      this.messages = data.items?.map((msg: any) => ({
        to: msg.To?.[0]?.Mailbox + '@' + msg.To?.[0]?.Domain,
        from: msg.From?.Mailbox + '@' + msg.From?.Domain,
        subject: msg.Content?.Headers?.Subject?.[0] || '',
        html: msg.MIME?.Parts?.[1]?.Body || '',
        text: msg.MIME?.Parts?.[0]?.Body || msg.Content?.Body || '',
        headers: msg.Content?.Headers || {},
        timestamp: new Date(msg.Created),
      })) || [];

      return this.messages;
    } catch (err) {
      console.warn('Could not fetch emails:', err);
      return [];
    }
  }

  /**
   * Waits for an email matching criteria
   */
  async waitForEmail(
    criteria: {
      to?: string;
      subject?: string | RegExp;
      timeout?: number;
    }
  ): Promise<EmailMessage> {
    const timeout = criteria.timeout || 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await this.fetchMessages();

      const match = this.messages.find(msg => {
        if (criteria.to && !msg.to.includes(criteria.to)) return false;
        if (criteria.subject) {
          if (typeof criteria.subject === 'string') {
            if (!msg.subject.includes(criteria.subject)) return false;
          } else {
            if (!criteria.subject.test(msg.subject)) return false;
          }
        }
        return true;
      });

      if (match) return match;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(
      `Email not received within ${timeout}ms. Criteria: ${JSON.stringify(criteria)}`
    );
  }

  /**
   * Gets the most recent message
   */
  async getLatestMessage(): Promise<EmailMessage | null> {
    await this.fetchMessages();
    return this.messages[this.messages.length - 1] || null;
  }

  /**
   * Gets all messages for a specific recipient
   */
  async getMessagesForRecipient(email: string): Promise<EmailMessage[]> {
    await this.fetchMessages();
    return this.messages.filter(msg => msg.to.includes(email));
  }
}

export const emailCapture = new EmailCapture();

/**
 * Setup email capture before tests
 */
export async function setupEmailCapture(): Promise<void> {
  await emailCapture.clear();
}

/**
 * Verifies that a contract notification email was sent
 */
export async function verifyContractNotificationSent(
  recipientEmail: string,
  contractTitle: string,
  notificationType: 'sent' | 'reminder' | 'signed' | 'declined' | 'voided' | 'expired'
): Promise<void> {
  const subjectPatterns: Record<string, RegExp> = {
    sent: /contract.*sent|new contract/i,
    reminder: /contract.*reminder|expires soon/i,
    signed: /contract.*signed|signature received/i,
    declined: /contract.*declined|rejected/i,
    voided: /contract.*voided|cancelled/i,
    expired: /contract.*expired/i,
  };

  const email = await emailCapture.waitForEmail({
    to: recipientEmail,
    subject: subjectPatterns[notificationType],
    timeout: 10000,
  });

  // Verify email content includes contract title
  expect(email.html + email.text).toContain(contractTitle);
}

/**
 * Extracts signing link from email
 */
export async function extractSigningLinkFromEmail(
  recipientEmail: string
): Promise<string> {
  const email = await emailCapture.waitForEmail({
    to: recipientEmail,
    subject: /contract.*sent|sign/i,
    timeout: 10000,
  });

  // Extract URL from email body
  const urlMatch = (email.html || email.text).match(
    /https?:\/\/[^\s<>"]+\/portal\/contracts\/\d+\/sign[^\s<>"]*/
  );

  if (!urlMatch) {
    throw new Error('Could not find signing link in email');
  }

  return urlMatch[0];
}
