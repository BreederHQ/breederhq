// apps/finance/src/FinanceHub.tsx
// Finance hub - entry point explaining Finance is managed on entity tabs

import * as React from "react";
import { PageHeader, Card, Button, InvoiceCreateModal } from "@bhq/ui";
import { DollarSign, Users, Building2, Dog, Baby, Heart, Plus } from "lucide-react";
import { makeApi } from "./api";

export default function FinanceHub() {
  const api = React.useMemo(() => makeApi("/api/v1"), []);
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "finance", label: "Finance" },
        })
      );
    }
  }, []);

  const links = [
    {
      title: "Contacts",
      description: "View invoices, payments, and expenses for individual contacts",
      href: "/contacts",
      icon: Users,
    },
    {
      title: "Organizations",
      description: "Manage financial records for organizations",
      href: "/organizations",
      icon: Building2,
    },
    {
      title: "Animals",
      description: "Track expenses and income related to specific animals",
      href: "/animals",
      icon: Dog,
    },
    {
      title: "Offspring Groups",
      description: "Monitor finances for litters and offspring groups",
      href: "/offspring",
      icon: Baby,
    },
    {
      title: "Breeding Plans",
      description: "Review financial activity for breeding plans",
      href: "/breeding",
      icon: Heart,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Finance"
        subtitle="Financial management across your breeding operation"
        actions={
          <Button onClick={() => setShowInvoiceModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        }
      />

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <DollarSign className="h-6 w-6 text-[hsl(var(--brand-orange))] mt-1" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Finance Overview</h2>
            <p className="text-sm text-secondary">
              Finance is managed through dedicated Finance tabs on entity pages. Each entity type
              (Contacts, Organizations, Animals, Offspring Groups, and Breeding Plans) has its own
              Finance tab where you can:
            </p>
            <ul className="text-sm text-secondary list-disc list-inside space-y-1 ml-2">
              <li>Create and manage invoices</li>
              <li>Record and track payments</li>
              <li>Log and categorize expenses</li>
              <li>View complete financial history</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Access Finance by Entity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className="group block p-4 rounded-lg border border-hairline hover:border-[hsl(var(--brand-orange))]/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-secondary group-hover:text-[hsl(var(--brand-orange))] transition-colors mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold group-hover:text-[hsl(var(--brand-orange))] transition-colors">
                      {link.title}
                    </h4>
                    <p className="text-xs text-secondary">{link.description}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </Card>

      <InvoiceCreateModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={() => {
          // Successfully created - modal will close itself
          // No list to refresh on this page
        }}
        api={api}
      />
    </div>
  );
}
