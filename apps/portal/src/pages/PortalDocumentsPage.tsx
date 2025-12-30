// apps/portal/src/pages/PortalDocumentsPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockDocuments, type PortalDocument } from "../mock";

/* ───────────────── Document Row ───────────────── */

function DocumentRow({ document }: { document: PortalDocument }) {
  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-strong border border-hairline flex items-center justify-center text-lg">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-primary truncate">{document.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="neutral">{document.type}</Badge>
              <span className="text-xs text-secondary">{document.size}</span>
              <span className="text-xs text-secondary">Uploaded {document.uploadedAt}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          Download
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyDocuments() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        📁
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No documents</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When your breeder shares documents with you, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalDocumentsPage() {
  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Documents"
        subtitle={`${mockDocuments.length} document${mockDocuments.length !== 1 ? "s" : ""} available`}
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {mockDocuments.length === 0 ? (
          <EmptyDocuments />
        ) : (
          <div className="space-y-3">
            {mockDocuments.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
