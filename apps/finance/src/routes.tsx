import type { ReactNode } from "react";

export type Route = { path: string; label: string; element: ReactNode };

export const financeRoutes = (page: {
  FinanceHomePage: ReactNode;
  InvoicesPage: ReactNode;
  ExpensesPage: ReactNode;
}): Route[] => [
  { path: "/finance", label: "Finance", element: page.FinanceHomePage },
  { path: "/finance/invoices", label: "Invoices", element: page.InvoicesPage },
  { path: "/finance/expenses", label: "Expenses", element: page.ExpensesPage },
];
