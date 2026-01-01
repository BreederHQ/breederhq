// apps/portal/src/pages/PortalDocumentsPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { makeApi, type DocumentDTO, type DocumentCategory } from "@bhq/api";

// Resolve API base URL
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return envBase.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return window.location.origin.replace(/\/+$/, "");
}

const api = makeApi(getApiBase());

/* ───────────────── Document Row ───────────────── */

function DocumentRow({ document }: { document: DocumentDTO }) {
  const categoryLabels: Record<DocumentCategory, string> = {
    CONTRACT: "Contract",
    HEALTH: "Health",
    PEDIGREE: "Pedigree",
    PHOTO: "Photo",
    OTHER: "Other",
  };

  function formatSize(bytes: number | null): string {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-strong border border-hairline flex items-center justify-center text-lg">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-primary truncate">{document.name}</div>
            {document.description && (
              <div className="text-xs text-secondary mt-0.5 truncate">{document.description}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {document.category && <Badge variant="neutral">{categoryLabels[document.category]}</Badge>}
              {document.source === "offspring" && document.offspringName && (
                <Badge variant="blue">Offspring: {document.offspringName}</Badge>
              )}
              <span className="text-xs text-secondary">{formatSize(document.fileSizeBytes)}</span>
              <span className="text-xs text-secondary">Uploaded {formatDate(document.uploadedAt)}</span>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(document.fileUrl, "_blank")}
        >
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

/* ───────────────── Loading State ───────────────── */

function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[hsl(var(--brand-orange))] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-secondary">Loading documents...</p>
    </div>
  );
}

/* ───────────────── Error State ───────────────── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
        !
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">Could not load documents</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto mb-4">
        Something went wrong. Please try again.
      </p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = React.useState<DocumentDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.portalData.getDocuments();
      setDocuments(data.documents);
    } catch (err: any) {
      console.error("[PortalDocumentsPage] Failed to fetch documents:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Documents"
        subtitle={
          loading
            ? "Loading..."
            : documents.length > 0
            ? `${documents.length} document${documents.length !== 1 ? "s" : ""} available`
            : ""
        }
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={fetchDocuments} />
        ) : documents.length === 0 ? (
          <EmptyDocuments />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
