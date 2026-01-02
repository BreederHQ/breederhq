// apps/marketplace/src/demo/inquiryOutbox.ts
// localStorage-backed inquiry outbox for buyer activity tracking

export const INQUIRY_OUTBOX_KEY = "bhq_marketplace_inquiries";

export type InquiryStatus = "sent" | "delivered" | "replied";

export interface InquiryEntry {
  id: string;
  createdAt: string;
  breederName: string;
  breederSlug: string;
  listingTitle: string;
  listingSlug: string;
  message: string;
  status: InquiryStatus;
  lastUpdateAt: string;
}

/**
 * Generate a unique ID for an inquiry.
 */
function generateId(): string {
  return `inq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Read all inquiries from localStorage.
 */
export function getInquiries(): InquiryEntry[] {
  try {
    const data = localStorage.getItem(INQUIRY_OUTBOX_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed as InquiryEntry[];
  } catch {
    return [];
  }
}

/**
 * Save inquiries to localStorage.
 */
function saveInquiries(inquiries: InquiryEntry[]): void {
  try {
    localStorage.setItem(INQUIRY_OUTBOX_KEY, JSON.stringify(inquiries));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Add a new inquiry to the outbox.
 */
export function addInquiry(params: {
  breederName: string;
  breederSlug: string;
  listingTitle: string;
  listingSlug: string;
  message: string;
}): InquiryEntry {
  const now = new Date().toISOString();
  const inquiry: InquiryEntry = {
    id: generateId(),
    createdAt: now,
    breederName: params.breederName,
    breederSlug: params.breederSlug,
    listingTitle: params.listingTitle,
    listingSlug: params.listingSlug,
    message: params.message,
    status: "sent",
    lastUpdateAt: now,
  };

  const existing = getInquiries();
  existing.unshift(inquiry); // Add to beginning
  saveInquiries(existing);

  // In demo mode, simulate status progression after a delay
  simulateStatusProgression(inquiry.id);

  return inquiry;
}

/**
 * Update an inquiry's status.
 */
export function updateInquiryStatus(id: string, status: InquiryStatus): void {
  const inquiries = getInquiries();
  const index = inquiries.findIndex((i) => i.id === id);
  if (index === -1) return;

  inquiries[index] = {
    ...inquiries[index],
    status,
    lastUpdateAt: new Date().toISOString(),
  };
  saveInquiries(inquiries);
}

/**
 * Simulate status progression for demo purposes.
 * After 5 seconds, mark as delivered.
 * After 15 seconds, mark as replied (50% chance).
 */
function simulateStatusProgression(id: string): void {
  // Mark as delivered after 5 seconds
  setTimeout(() => {
    const inquiries = getInquiries();
    const inquiry = inquiries.find((i) => i.id === id);
    if (inquiry && inquiry.status === "sent") {
      updateInquiryStatus(id, "delivered");
    }
  }, 5000);

  // 50% chance to mark as replied after 15 seconds
  if (Math.random() > 0.5) {
    setTimeout(() => {
      const inquiries = getInquiries();
      const inquiry = inquiries.find((i) => i.id === id);
      if (inquiry && inquiry.status === "delivered") {
        updateInquiryStatus(id, "replied");
      }
    }, 15000);
  }
}

/**
 * Get inquiries by status filter.
 */
export function getInquiriesByStatus(status: InquiryStatus | "all"): InquiryEntry[] {
  const all = getInquiries();
  if (status === "all") return all;
  return all.filter((i) => i.status === status);
}

/**
 * Clear all inquiries (for testing).
 */
export function clearInquiries(): void {
  try {
    localStorage.removeItem(INQUIRY_OUTBOX_KEY);
  } catch {
    // Ignore
  }
}
