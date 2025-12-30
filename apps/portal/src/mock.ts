// apps/portal/src/mock.ts
// TODO: Replace mock data with real API calls when endpoints are available

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

/* ───────────────── Mock Data ───────────────── */

export const mockCounts: PortalCounts = {
  tasks: 3,
  unreadMessages: 2,
  pendingInvoices: 1,
  pendingAgreements: 1,
  documents: 5,
  offspring: 2,
  offspringGroups: 1,
  waitlistPositions: 1,
  upcomingAppointments: 1,
};

export const mockTasks: PortalTask[] = [
  {
    id: "task-1",
    title: "Complete puppy health questionnaire",
    dueDate: "2025-01-05",
    status: "pending",
    priority: "high",
  },
  {
    id: "task-2",
    title: "Schedule pickup appointment",
    dueDate: "2025-01-10",
    status: "pending",
    priority: "medium",
  },
  {
    id: "task-3",
    title: "Review care instructions",
    dueDate: "2025-01-15",
    status: "in_progress",
    priority: "low",
  },
];

export const mockMessages: PortalMessage[] = [
  {
    id: "msg-1",
    from: "Happy Paws Kennel",
    subject: "Your puppy is ready for pickup!",
    preview: "Hi! We wanted to let you know that your puppy...",
    date: "2024-12-29",
    read: false,
  },
  {
    id: "msg-2",
    from: "Happy Paws Kennel",
    subject: "Upcoming vaccination schedule",
    preview: "Here is the vaccination schedule for...",
    date: "2024-12-27",
    read: false,
  },
  {
    id: "msg-3",
    from: "Happy Paws Kennel",
    subject: "Welcome to the family!",
    preview: "Thank you for choosing us. We are excited...",
    date: "2024-12-20",
    read: true,
  },
];

export const mockInvoices: PortalInvoice[] = [
  {
    id: "inv-1",
    amount: 500,
    status: "pending",
    dueDate: "2025-01-15",
    description: "Final payment for puppy placement",
  },
  {
    id: "inv-2",
    amount: 250,
    status: "paid",
    dueDate: "2024-12-15",
    description: "Deposit for puppy reservation",
  },
];

export const mockAgreements: PortalAgreement[] = [
  {
    id: "agr-1",
    title: "Puppy Purchase Agreement",
    status: "pending",
    dueDate: "2025-01-10",
  },
  {
    id: "agr-2",
    title: "Health Guarantee",
    status: "signed",
    dueDate: null,
  },
];

export const mockDocuments: PortalDocument[] = [
  {
    id: "doc-1",
    name: "Vaccination Record",
    type: "PDF",
    uploadedAt: "2024-12-28",
    size: "245 KB",
  },
  {
    id: "doc-2",
    name: "Pedigree Certificate",
    type: "PDF",
    uploadedAt: "2024-12-25",
    size: "1.2 MB",
  },
  {
    id: "doc-3",
    name: "Health Clearances",
    type: "PDF",
    uploadedAt: "2024-12-20",
    size: "890 KB",
  },
  {
    id: "doc-4",
    name: "Microchip Registration",
    type: "PDF",
    uploadedAt: "2024-12-18",
    size: "156 KB",
  },
  {
    id: "doc-5",
    name: "Care Guide",
    type: "PDF",
    uploadedAt: "2024-12-15",
    size: "2.4 MB",
  },
];

export const mockOffspring: PortalOffspring[] = [
  {
    id: "off-1",
    name: "Luna",
    breed: "Golden Retriever",
    dob: "2024-10-15",
    status: "reserved",
  },
  {
    id: "off-2",
    name: "Max",
    breed: "Golden Retriever",
    dob: "2024-10-15",
    status: "placed",
  },
];

export const mockOffspringGroups: PortalOffspringGroup[] = [
  {
    id: "grp-1",
    name: "Spring 2025 Litter",
    count: 6,
    expectedDate: "2025-03-15",
  },
];

export const mockWaitlist: PortalWaitlistEntry[] = [
  {
    id: "wl-1",
    breed: "Golden Retriever",
    color: "Cream",
    gender: "Female",
    position: 3,
    joinedAt: "2024-11-01",
  },
];

export const mockAppointments: PortalAppointment[] = [
  {
    id: "apt-1",
    title: "Puppy Pickup",
    date: "2025-01-12",
    time: "10:00 AM",
    location: "Happy Paws Kennel",
    status: "scheduled",
  },
];

/* ───────────────── Feature Flag ───────────────── */

// TODO: Replace with actual role/permission check when available
export const PORTAL_FEATURE_FLAGS = {
  // Set to true when real data is available
  USE_REAL_DATA: false,
  // Role-based visibility stubs
  SHOW_BILLING: true,
  SHOW_AGREEMENTS: true,
  SHOW_OFFSPRING: true,
  SHOW_WAITLIST: true,
  SHOW_SCHEDULING: true,
};
