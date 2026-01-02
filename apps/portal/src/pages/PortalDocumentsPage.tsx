// apps/portal/src/pages/PortalDocumentsPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalEmptyState } from "../design/PortalEmptyState";
import { makeApi } from "@bhq/api";
import type { DocumentDTO, DocumentCategory } from "@bhq/api";
import { isPortalMockEnabled } from "../dev/mockFlag";
import { DemoBanner } from "../dev/DemoBanner";
import { mockDocuments } from "../dev/mockData";

// Resolve API base URL (same pattern as taskSources)
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
  }
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) {
    return normalizeBase(windowBase);
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const api = makeApi(getApiBase());

/* ────────────────────────────────────────────────────────────────────────────
 * Document Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface DocumentRowProps {
  document: DocumentDTO;
}

function DocumentRow({ document }: DocumentRowProps) {
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
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div
      style={{
        padding: "var(--portal-space-3)",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            background: "var(--portal-bg-elevated)",
            border: "1px solid var(--portal-border-subtle)",
            borderRadius: "var(--portal-radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          📄
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {document.name}
          </div>
          {document.description && (
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-secondary)",
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {document.description}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-2)",
              marginTop: "var(--portal-space-1)",
              flexWrap: "wrap",
            }}
          >
            {document.category && (
              <span
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                }}
              >
                {categoryLabels[document.category]}
              </span>
            )}
            {document.source === "offspring" && document.offspringName && (
              <span
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-accent)",
                }}
              >
                {document.offspringName}
              </span>
            )}
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
              }}
            >
              {formatSize(document.fileSizeBytes)}
            </span>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
              }}
            >
              {formatDate(document.uploadedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ────────────────────────────────────────────────────────────────────────── */

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = React.useState<DocumentDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const mockEnabled = isPortalMockEnabled();

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.portalData.getDocuments();
      const fetchedDocs = data.documents;

      // Use mock data if real data is empty and demo mode enabled
      if (fetchedDocs.length === 0 && mockEnabled) {
        setDocuments(mockDocuments() as any);
      } else {
        setDocuments(fetchedDocs);
      }
    } catch (err: any) {
      console.error("[PortalDocumentsPage] Failed to fetch documents:", err);

      // If error and demo mode, use mock data
      if (mockEnabled) {
        setDocuments(mockDocuments() as any);
      } else {
        setError("Failed to load documents");
      }
    } finally {
      setLoading(false);
    }
  }, [mockEnabled]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRetry = () => {
    fetchDocuments();
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--portal-space-3)",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "80px",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-lg)",
              }}
            />
          ))}
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "60vh",
            gap: "var(--portal-space-3)",
          }}
        >
          <div
            style={{
              fontSize: "var(--portal-font-size-xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
            }}
          >
            Unable to load documents
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {error}
          </div>
          <button
            onClick={handleRetry}
            style={{
              padding: "var(--portal-space-2) var(--portal-space-4)",
              background: "var(--portal-accent)",
              color: "var(--portal-text-primary)",
              border: "none",
              borderRadius: "var(--portal-radius-md)",
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <PageContainer>
        <PortalEmptyState
          title="No documents"
          body="Documents shared with you will appear here."
        />
      </PageContainer>
    );
  }

  // List view
  return (
    <PageContainer>
      {mockEnabled && (
        <div style={{ marginBottom: "var(--portal-space-3)" }}>
          <DemoBanner />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Page header with download notice */}
        <div>
          <h1
            style={{
              fontSize: "var(--portal-font-size-2xl)",
              fontWeight: "var(--portal-font-weight-semibold)",
              color: "var(--portal-text-primary)",
              margin: 0,
              marginBottom: "var(--portal-space-1)",
            }}
          >
            Documents
          </h1>
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
            }}
          >
            Downloads are not available in the client portal.
          </p>
        </div>

        {/* Document List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
