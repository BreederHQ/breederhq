// packages/ui/src/utils/financeRollups.ts
// Pure utility functions for computing financial rollups on breeding plans

export interface Invoice {
  id: number;
  totalCents: number;
  balanceCents: number;
  status?: string;
  issuedAt?: string | null;
  serviceCode?: string | null;
  breedingPlanId?: number | null;
  offspringGroupId?: number | null;
  offspringId?: number | null;
  createdAt?: string;
}

export interface Payment {
  id: number;
  amountCents: number;
  receivedAt?: string | null;
  invoiceId?: number;
  createdAt?: string;
}

export interface OffspringGroup {
  id: number;
  breedingPlanId: number;
  birthDate?: string | null;
}

export interface Offspring {
  id: number;
  offspringGroupId: number;
}

export interface RevenueSummary {
  totalInvoicedCents: number;
  totalCollectedCents: number;
  outstandingCents: number;
  invoiceCount: number;
}

export interface DepositSummary {
  totalDepositInvoicedCents: number;
  totalDepositCollectedCents: number;
  depositOutstandingCents: number;
  averageDepositPerOffspringCents: number;
}

export interface PricingSummary {
  averagePricePerOffspringCents: number;
  minPriceCents: number;
  maxPriceCents: number;
  offspringWithPricing: number;
}

export interface DepositTiming {
  percentCollectedBeforeBirth: number;
  percentCollectedAfterBirth: number;
  firstDepositDate?: string;
  hasSufficientData: boolean;
}

/**
 * Determine if an invoice represents a deposit based on available data patterns
 */
function isDepositInvoice(invoice: Invoice): boolean {
  // Check serviceCode for "deposit" keyword (case-insensitive)
  if (invoice.serviceCode && invoice.serviceCode.toLowerCase().includes("deposit")) {
    return true;
  }

  // Additional heuristics can be added here if needed
  // For now, we rely primarily on serviceCode
  return false;
}

/**
 * Compute revenue summary from invoices and payments
 */
export function computeRevenueSummary(
  invoices: Invoice[],
  payments: Payment[]
): RevenueSummary {
  const totalInvoicedCents = invoices.reduce((sum, inv) => sum + (inv.totalCents || 0), 0);

  // Collect payments for the given invoices
  const invoiceIds = new Set(invoices.map((inv) => inv.id));
  const relevantPayments = payments.filter((p) => p.invoiceId && invoiceIds.has(p.invoiceId));
  const totalCollectedCents = relevantPayments.reduce(
    (sum, pay) => sum + (pay.amountCents || 0),
    0
  );

  const outstandingCents = totalInvoicedCents - totalCollectedCents;

  return {
    totalInvoicedCents,
    totalCollectedCents,
    outstandingCents,
    invoiceCount: invoices.length,
  };
}

/**
 * Compute deposit summary from invoices and payments
 */
export function computeDepositSummary(
  invoices: Invoice[],
  payments: Payment[],
  offspringCount: number
): DepositSummary {
  const depositInvoices = invoices.filter(isDepositInvoice);
  const totalDepositInvoicedCents = depositInvoices.reduce(
    (sum, inv) => sum + (inv.totalCents || 0),
    0
  );

  // Collect payments for deposit invoices
  const depositInvoiceIds = new Set(depositInvoices.map((inv) => inv.id));
  const depositPayments = payments.filter(
    (p) => p.invoiceId && depositInvoiceIds.has(p.invoiceId)
  );
  const totalDepositCollectedCents = depositPayments.reduce(
    (sum, pay) => sum + (pay.amountCents || 0),
    0
  );

  const depositOutstandingCents = totalDepositInvoicedCents - totalDepositCollectedCents;

  const averageDepositPerOffspringCents =
    offspringCount > 0 ? Math.round(totalDepositInvoicedCents / offspringCount) : 0;

  return {
    totalDepositInvoicedCents,
    totalDepositCollectedCents,
    depositOutstandingCents,
    averageDepositPerOffspringCents,
  };
}

/**
 * Compute pricing statistics per offspring
 */
export function computePricingStats(
  invoices: Invoice[],
  offspring: Offspring[]
): PricingSummary {
  // Group invoices by offspringId
  const offspringMap: Record<number, number> = {};

  invoices.forEach((inv) => {
    if (inv.offspringId) {
      if (!offspringMap[inv.offspringId]) {
        offspringMap[inv.offspringId] = 0;
      }
      offspringMap[inv.offspringId] += inv.totalCents || 0;
    }
  });

  const offspringPrices = Object.values(offspringMap);

  if (offspringPrices.length === 0) {
    return {
      averagePricePerOffspringCents: 0,
      minPriceCents: 0,
      maxPriceCents: 0,
      offspringWithPricing: 0,
    };
  }

  const totalPriceCents = offspringPrices.reduce((sum, price) => sum + price, 0);
  const averagePricePerOffspringCents = Math.round(totalPriceCents / offspringPrices.length);
  const minPriceCents = Math.min(...offspringPrices);
  const maxPriceCents = Math.max(...offspringPrices);

  return {
    averagePricePerOffspringCents,
    minPriceCents,
    maxPriceCents,
    offspringWithPricing: offspringPrices.length,
  };
}

/**
 * Compute deposit timing insights relative to birth date
 */
export function computeDepositTiming(
  invoices: Invoice[],
  payments: Payment[],
  birthDate?: string | null
): DepositTiming {
  if (!birthDate) {
    return {
      percentCollectedBeforeBirth: 0,
      percentCollectedAfterBirth: 0,
      hasSufficientData: false,
    };
  }

  const depositInvoices = invoices.filter(isDepositInvoice);
  const depositInvoiceIds = new Set(depositInvoices.map((inv) => inv.id));
  const depositPayments = payments.filter(
    (p) => p.invoiceId && depositInvoiceIds.has(p.invoiceId)
  );

  if (depositPayments.length === 0) {
    return {
      percentCollectedBeforeBirth: 0,
      percentCollectedAfterBirth: 0,
      hasSufficientData: false,
    };
  }

  const birthTime = new Date(birthDate).getTime();
  let beforeBirthCents = 0;
  let afterBirthCents = 0;
  let firstDepositDate: string | undefined;

  depositPayments.forEach((pay) => {
    const paymentDate = pay.receivedAt || pay.createdAt;
    if (!paymentDate) return;

    const paymentTime = new Date(paymentDate).getTime();

    // Track first deposit date
    if (!firstDepositDate || paymentTime < new Date(firstDepositDate).getTime()) {
      firstDepositDate = paymentDate;
    }

    if (paymentTime < birthTime) {
      beforeBirthCents += pay.amountCents || 0;
    } else {
      afterBirthCents += pay.amountCents || 0;
    }
  });

  const totalCents = beforeBirthCents + afterBirthCents;

  if (totalCents === 0) {
    return {
      percentCollectedBeforeBirth: 0,
      percentCollectedAfterBirth: 0,
      firstDepositDate,
      hasSufficientData: false,
    };
  }

  return {
    percentCollectedBeforeBirth: Math.round((beforeBirthCents / totalCents) * 100),
    percentCollectedAfterBirth: Math.round((afterBirthCents / totalCents) * 100),
    firstDepositDate,
    hasSufficientData: true,
  };
}
