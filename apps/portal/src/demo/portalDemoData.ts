// apps/portal/src/demo/portalDemoData.ts
// Demo data generator for Portal app
// Access with: ?demo=true in URL

export interface DemoDataConfig {
  includeMessages: boolean;
  includeInvoices: boolean;
  includeAgreements: boolean;
  includeDocuments: boolean;
  includeOffspring: boolean;
  includeTasks: boolean;
  includeNotifications: boolean;
}

export interface DemoPlacement {
  id: number;
  offspring: {
    name: string;
    species: string;
    breed: string;
  };
  placementStatus: string;
  species: string;
  breed: string;
  paidInFullAt: string | null;
  pickupAt: string | null;
  lastUpdate?: {
    text: string;
    timestamp: string;
  };
  photos?: string[];
}

export interface DemoInvoice {
  id: number;
  invoiceNumber: string;
  description: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  relatedOffspringName: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface DemoTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  paymentMethod: string;
  invoiceNumber?: string;
}

export interface DemoAgreement {
  id: number;
  title: string;
  description: string;
  status: string;
  sentAt: string;
  signedAt?: string;
}

export interface DemoDocument {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: string;
}

export interface DemoThread {
  id: number;
  subject: string;
  participants: string[];
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  messages: Array<{
    id: number;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
    read: boolean;
  }>;
}

export interface DemoActivityEvent {
  id: number;
  type: "message" | "document" | "payment" | "update" | "agreement";
  title: string;
  timestamp: string;
  relatedPath?: string;
}

export interface DemoData {
  placements: DemoPlacement[];
  invoices: DemoInvoice[];
  transactions: DemoTransaction[];
  agreements: DemoAgreement[];
  documents: DemoDocument[];
  threads: DemoThread[];
  activityEvents: DemoActivityEvent[];
  financialSummary: {
    totalDue: number;
    totalPaid: number;
    totalAmount: number;
    overdueAmount: number;
    nextPaymentDueAt: string | null;
  };
}

function generateDemoPlacement(): DemoPlacement {
  return {
    id: 1,
    offspring: {
      name: "Luna",
      species: "dog",
      breed: "Golden Retriever",
    },
    placementStatus: "reserved",
    species: "dog",
    breed: "Golden Retriever",
    paidInFullAt: null,
    pickupAt: null,
    lastUpdate: {
      text: "Luna is progressing well in obedience training. She's mastered sit, stay, and come commands. Next vet check scheduled for January 15th. She's very social and loves playing with the other puppies!",
      timestamp: "2026-01-09T14:30:00Z",
    },
    photos: [
      "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&auto=format&fit=crop", // Golden Retriever puppy
      "https://images.unsplash.com/photo-1612536982603-e926c2206e51?w=800&auto=format&fit=crop", // Golden Retriever playing
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop", // Golden Retriever close-up
    ],
  };
}

function generateDemoInvoices(): DemoInvoice[] {
  return [
    // 1 overdue invoice
    {
      id: 1,
      invoiceNumber: "INV-001",
      description: "Initial Deposit - Luna",
      total: 500,
      amountPaid: 0,
      amountDue: 500,
      status: "overdue",
      issuedAt: "2025-12-01",
      dueAt: "2025-12-15",
      relatedOffspringName: "Luna",
      lineItems: [
        { description: "Deposit", quantity: 1, unitPrice: 500, total: 500 },
      ],
    },
    // 2 due invoices
    {
      id: 2,
      invoiceNumber: "INV-002",
      description: "Second Payment - Luna",
      total: 1000,
      amountPaid: 0,
      amountDue: 1000,
      status: "due",
      issuedAt: "2026-01-01",
      dueAt: "2026-01-20",
      relatedOffspringName: "Luna",
      lineItems: [
        { description: "Payment 2 of 3", quantity: 1, unitPrice: 1000, total: 1000 },
      ],
    },
    {
      id: 3,
      invoiceNumber: "INV-003",
      description: "Final Payment - Luna",
      total: 1500,
      amountPaid: 0,
      amountDue: 1500,
      status: "due",
      issuedAt: "2026-01-05",
      dueAt: "2026-02-01",
      relatedOffspringName: "Luna",
      lineItems: [
        { description: "Final Payment", quantity: 1, unitPrice: 1500, total: 1500 },
      ],
    },
    // 2 paid invoices
    {
      id: 4,
      invoiceNumber: "INV-004",
      description: "Veterinary Exam - Luna",
      total: 150,
      amountPaid: 150,
      amountDue: 0,
      status: "paid",
      issuedAt: "2025-11-15",
      dueAt: "2025-11-30",
      paidAt: "2025-11-28",
      relatedOffspringName: "Luna",
      lineItems: [
        { description: "Vet exam and health certificate", quantity: 1, unitPrice: 150, total: 150 },
      ],
    },
    {
      id: 5,
      invoiceNumber: "INV-005",
      description: "Microchip Registration",
      total: 50,
      amountPaid: 50,
      amountDue: 0,
      status: "paid",
      issuedAt: "2025-11-20",
      dueAt: "2025-12-05",
      paidAt: "2025-12-03",
      relatedOffspringName: "Luna",
      lineItems: [
        { description: "Microchip and registration", quantity: 1, unitPrice: 50, total: 50 },
      ],
    },
  ];
}

function generateDemoTransactions(): DemoTransaction[] {
  return [
    {
      id: 1,
      date: "2025-11-28",
      description: "Payment for INV-004 (Veterinary Exam)",
      amount: 150,
      type: "payment",
      status: "completed",
      paymentMethod: "card",
      invoiceNumber: "INV-004",
    },
    {
      id: 2,
      date: "2025-12-03",
      description: "Payment for INV-005 (Microchip Registration)",
      amount: 50,
      type: "payment",
      status: "completed",
      paymentMethod: "card",
      invoiceNumber: "INV-005",
    },
    {
      id: 3,
      date: "2025-10-15",
      description: "Initial consultation refund",
      amount: 25,
      type: "refund",
      status: "completed",
      paymentMethod: "card",
    },
  ];
}

function generateDemoAgreements(): DemoAgreement[] {
  return [
    // 1 pending signature
    {
      id: 1,
      title: "Puppy Purchase Agreement",
      description: "Standard purchase agreement for Luna",
      status: "sent",
      sentAt: "2025-12-10",
    },
    // 1 signed
    {
      id: 2,
      title: "Health Guarantee",
      description: "Two-year health guarantee",
      status: "signed",
      sentAt: "2025-11-20",
      signedAt: "2025-11-22",
    },
  ];
}

function generateDemoDocuments(): DemoDocument[] {
  return [
    {
      id: 1,
      name: "Luna - Health Certificate.pdf",
      type: "pdf",
      size: 245000,
      uploadedAt: "2025-11-28",
      category: "health",
    },
    {
      id: 2,
      name: "Luna - Pedigree.pdf",
      type: "pdf",
      size: 180000,
      uploadedAt: "2025-11-25",
      category: "pedigree",
    },
    {
      id: 3,
      name: "Luna - Vaccination Record.pdf",
      type: "pdf",
      size: 120000,
      uploadedAt: "2025-12-01",
      category: "health",
    },
    {
      id: 4,
      name: "Care Instructions.pdf",
      type: "pdf",
      size: 95000,
      uploadedAt: "2025-11-15",
      category: "general",
    },
  ];
}

function generateDemoActivityEvents(): DemoActivityEvent[] {
  return [
    {
      id: 1,
      type: "message",
      title: "New message from Sarah",
      timestamp: "2026-01-10T14:30:00Z",
      relatedPath: "/messages",
    },
    {
      id: 2,
      type: "update",
      title: "Training update for Luna",
      timestamp: "2026-01-09T10:00:00Z",
      relatedPath: "/offspring",
    },
    {
      id: 3,
      type: "document",
      title: "Vaccination Record uploaded",
      timestamp: "2026-01-08T16:00:00Z",
      relatedPath: "/documents",
    },
    {
      id: 4,
      type: "payment",
      title: "Payment received - Thank you!",
      timestamp: "2026-01-05T12:00:00Z",
      relatedPath: "/financials",
    },
    {
      id: 5,
      type: "document",
      title: "Health Certificate uploaded",
      timestamp: "2026-01-03T09:00:00Z",
      relatedPath: "/documents",
    },
  ];
}

function generateDemoThreads(): DemoThread[] {
  return [
    {
      id: 1,
      subject: "Pickup arrangements",
      participants: ["You", "Breeder"],
      lastMessageAt: "2026-01-10T14:30:00Z",
      lastMessagePreview: "I can meet you at 2pm on Saturday. Does that work?",
      unreadCount: 2,
      messages: [
        {
          id: 1,
          senderId: "breeder",
          senderName: "Breeder",
          content: "Hi! Luna is ready for pickup. When would work for you?",
          sentAt: "2026-01-09T10:00:00Z",
          read: true,
        },
        {
          id: 2,
          senderId: "you",
          senderName: "You",
          content: "How about this Saturday around 2pm?",
          sentAt: "2026-01-09T14:00:00Z",
          read: true,
        },
        {
          id: 3,
          senderId: "breeder",
          senderName: "Breeder",
          content: "I can meet you at 2pm on Saturday. Does that work?",
          sentAt: "2026-01-10T14:30:00Z",
          read: false,
        },
      ],
    },
    {
      id: 2,
      subject: "Payment question",
      participants: ["You", "Breeder"],
      lastMessageAt: "2026-01-08T16:00:00Z",
      lastMessagePreview: "No problem! Let me know when you're ready.",
      unreadCount: 0,
      messages: [
        {
          id: 4,
          senderId: "you",
          senderName: "You",
          content: "Can I split the final payment into two installments?",
          sentAt: "2026-01-08T12:00:00Z",
          read: true,
        },
        {
          id: 5,
          senderId: "breeder",
          senderName: "Breeder",
          content: "No problem! Let me know when you're ready.",
          sentAt: "2026-01-08T16:00:00Z",
          read: true,
        },
      ],
    },
    {
      id: 3,
      subject: "Welcome!",
      participants: ["You", "Breeder"],
      lastMessageAt: "2025-11-15T09:00:00Z",
      lastMessagePreview: "Welcome to your client portal! Feel free to reach out with any questions.",
      unreadCount: 0,
      messages: [
        {
          id: 6,
          senderId: "breeder",
          senderName: "Breeder",
          content: "Welcome to your client portal! Feel free to reach out with any questions.",
          sentAt: "2025-11-15T09:00:00Z",
          read: true,
        },
      ],
    },
  ];
}

// Cache key for sessionStorage
const DEMO_CACHE_KEY = 'bhq-portal-demo-cache';

// Get cached demo data from sessionStorage
function getCachedDemoData(): DemoData | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(DEMO_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    console.error('[DemoData] Error reading cache:', e);
    return null;
  }
}

// Save demo data to sessionStorage
function setCachedDemoData(data: DemoData): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DEMO_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[DemoData] Error saving cache:', e);
  }
}

// Clear cached demo data
function clearCachedDemoData(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DEMO_CACHE_KEY);
}

export function generateDemoData(config: DemoDataConfig = {
  includeMessages: true,
  includeInvoices: true,
  includeAgreements: true,
  includeDocuments: true,
  includeOffspring: true,
  includeTasks: true,
  includeNotifications: true,
}): DemoData {
  const currentDemoMode = isDemoMode();

  // If demo mode is not active, clear cache and return empty
  if (!currentDemoMode) {
    clearCachedDemoData();
    return {
      placements: [],
      invoices: [],
      transactions: [],
      agreements: [],
      documents: [],
      threads: [],
      activityEvents: [],
      financialSummary: {
        totalDue: 0,
        totalPaid: 0,
        totalAmount: 0,
        overdueAmount: 0,
        nextPaymentDueAt: null,
      },
    };
  }

  // Try to get cached data
  const cachedData = getCachedDemoData();
  if (cachedData) {
    return cachedData;
  }

  // Generate fresh demo data
  const invoices = config.includeInvoices ? generateDemoInvoices() : [];

  const newData: DemoData = {
    placements: [generateDemoPlacement()],
    invoices,
    transactions: config.includeInvoices ? generateDemoTransactions() : [],
    agreements: config.includeAgreements ? generateDemoAgreements() : [],
    documents: config.includeDocuments ? generateDemoDocuments() : [],
    threads: config.includeMessages ? generateDemoThreads() : [],
    activityEvents: generateDemoActivityEvents(),
    financialSummary: {
      totalDue: 3000,
      totalPaid: 200,
      totalAmount: 3200,
      overdueAmount: 500,
      nextPaymentDueAt: "2026-01-20",
    },
  };

  // Cache the data
  setCachedDemoData(newData);

  return newData;
}

// Force refresh demo data (clears cache)
export function refreshDemoData(): void {
  clearCachedDemoData();
  if (isDemoMode()) {
    generateDemoData(); // Regenerate immediately
  }
}

// Check if demo mode is active
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.search.includes("demo=true");
}

// Enable demo mode
export function enableDemoMode() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("demo", "true");
  window.history.pushState({}, "", url.toString());
  clearCachedDemoData(); // Clear cache before reload
  window.location.reload();
}

// Disable demo mode
export function disableDemoMode() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  window.history.pushState({}, "", url.toString());
  clearCachedDemoData(); // Clear cache before reload
  window.location.reload();
}
