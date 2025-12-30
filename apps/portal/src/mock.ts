// apps/portal/src/mock.ts
// TODO: Replace with real API calls when endpoints are available

/* ───────────────── Types ───────────────── */

export interface PortalTask {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

export interface PortalMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
}

export interface PortalInvoice {
  id: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  description: string;
}

export interface PortalAgreement {
  id: string;
  title: string;
  status: "pending" | "signed" | "expired";
  dueDate: string | null;
}

export interface PortalDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export interface PortalOffspring {
  id: string;
  name: string;
  breed: string;
  dob: string;
  status: "reserved" | "available" | "placed";
  photo?: string;
}

export interface PortalOffspringGroup {
  id: string;
  name: string;
  count: number;
  expectedDate: string;
}

export interface PortalWaitlistEntry {
  id: string;
  breed: string;
  color: string | null;
  gender: string | null;
  position: number;
  joinedAt: string;
}

export interface PortalAppointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface PortalCounts {
  tasks: number;
  unreadMessages: number;
  pendingInvoices: number;
  pendingAgreements: number;
  documents: number;
  offspring: number;
  offspringGroups: number;
  waitlistPositions: number;
  upcomingAppointments: number;
}

/* ───────────────── Data (empty for skeleton) ───────────────── */

export const mockCounts: PortalCounts = {
  tasks: 0,
  unreadMessages: 0,
  pendingInvoices: 0,
  pendingAgreements: 0,
  documents: 0,
  offspring: 0,
  offspringGroups: 0,
  waitlistPositions: 0,
  upcomingAppointments: 0,
};

export const mockTasks: PortalTask[] = [];

export const mockMessages: PortalMessage[] = [];

export const mockInvoices: PortalInvoice[] = [];

export const mockAgreements: PortalAgreement[] = [];

export const mockDocuments: PortalDocument[] = [];

export const mockOffspring: PortalOffspring[] = [];

export const mockOffspringGroups: PortalOffspringGroup[] = [];

export const mockWaitlist: PortalWaitlistEntry[] = [];

export const mockAppointments: PortalAppointment[] = [];

/* ───────────────── Feature Flags ───────────────── */

// TODO: Replace with actual role/permission check when available
export const PORTAL_FEATURE_FLAGS = {
  // Role-based visibility stubs
  SHOW_BILLING: true,
  SHOW_AGREEMENTS: true,
  SHOW_OFFSPRING: true,
  SHOW_WAITLIST: true,
  SHOW_SCHEDULING: true,
};
