// apps/portal/src/pages/PortalDocumentsPageNew.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { makeApi } from "@bhq/api";
import type { DocumentDTO, DocumentCategory } from "@bhq/api";
import { SubjectHeader } from "../components/SubjectHeader";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";
import { isDemoMode, generateDemoData } from "../demo/portalDemoData";

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
 * Document Category Config
 * ──────────────────────────────────────────────────────────────────────────── */

const categoryConfig: Record<DocumentCategory, { label: string; emoji: string; bg: string }> = {
  CONTRACT: { label: "Contract", emoji: "📝", bg: "var(--portal-info-soft)" },
  HEALTH: { label: "Health", emoji: "💉", bg: "var(--portal-success-soft)" },
  PEDIGREE: { label: "Pedigree", emoji: "🏆", bg: "var(--portal-warning-soft)" },
  PHOTO: { label: "Photo", emoji: "📷", bg: "var(--portal-accent-soft)" },
  OTHER: { label: "Other", emoji: "📄", bg: "var(--portal-bg-elevated)" },
};

/* ────────────────────────────────────────────────────────────────────────────
 * Document Icon
 * ──────────────────────────────────────────────────────────────────────────── */

function DocumentIcon({ category }: { category: DocumentCategory | undefined }) {
  const config = category ? categoryConfig[category] : categoryConfig.OTHER;

  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--portal-radius-lg)",
        background: config.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
        flexShrink: 0,
      }}
    >
      {config.emoji}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Category Badge
 * ──────────────────────────────────────────────────────────────────────────── */

function CategoryBadge({ category }: { category: DocumentCategory | undefined }) {
  if (!category) return null;

  const config = categoryConfig[category];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        background: config.bg,
        borderRadius: "var(--portal-radius-full)",
        fontSize: "var(--portal-font-size-xs)",
        fontWeight: "var(--portal-font-weight-medium)",
        color: "var(--portal-text-secondary)",
      }}
    >
      {config.label}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Format Helpers
 * ──────────────────────────────────────────────────────────────────────────── */

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
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

/* ────────────────────────────────────────────────────────────────────────────
 * Document Row Component
 * ──────────────────────────────────────────────────────────────────────────── */

interface DocumentRowProps {
  document: DocumentDTO;
}

function DocumentRow({ document }: DocumentRowProps) {
  // Documents are read-only in the portal, no click action
  // But we can style them nicely

  const sizeStr = formatSize(document.fileSizeBytes);
  const dateStr = formatDate(document.uploadedAt);

  return (
    <CardRow>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--portal-space-3)" }}>
        <DocumentIcon category={document.category ?? undefined} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {document.name}
            </div>
            <CategoryBadge category={document.category ?? undefined} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-3)",
              flexWrap: "wrap",
            }}
          >
            {document.description && (
              <div
                style={{
                  fontSize: "var(--portal-font-size-sm)",
                  color: "var(--portal-text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
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
                flexShrink: 0,
              }}
            >
              {document.offspringName && (
                <span
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    color: "var(--portal-accent)",
                    fontWeight: "var(--portal-font-weight-medium)",
                  }}
                >
                  {document.offspringName}
                </span>
              )}
              {sizeStr && (
                <span
                  style={{
                    fontSize: "var(--portal-font-size-xs)",
                    color: "var(--portal-text-tertiary)",
                  }}
                >
                  {sizeStr}
                </span>
              )}
              <span
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                }}
              >
                {dateStr}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Document Group Section
 * ──────────────────────────────────────────────────────────────────────────── */

interface DocumentGroupProps {
  title: string;
  documents: DocumentDTO[];
}

function DocumentGroup({ title, documents }: DocumentGroupProps) {
  if (documents.length === 0) return null;

  return (
    <div style={{ marginBottom: "var(--portal-space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
          marginBottom: "var(--portal-space-3)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-semibold)",
            textTransform: "uppercase",
            letterSpacing: "var(--portal-letter-spacing-wide)",
            color: "var(--portal-text-tertiary)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            background: "var(--portal-bg-elevated)",
            padding: "2px 8px",
            borderRadius: "var(--portal-radius-full)",
          }}
        >
          {documents.length}
        </span>
      </div>
      <PortalCard variant="elevated" padding="none">
        {documents.map((doc) => (
          <DocumentRow key={doc.id} document={doc} />
        ))}
      </PortalCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyDocuments() {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          📁
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          No documents yet
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          Documents will appear here when shared by your breeder.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "120px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-xl)",
        }}
      />
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
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error State
 * ──────────────────────────────────────────────────────────────────────────── */

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-error-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: "var(--portal-error)",
          }}
        >
          !
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          Unable to load documents
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          {error}
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: "var(--portal-space-2) var(--portal-space-4)",
            background: "var(--portal-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            cursor: "pointer",
            transition: "opacity var(--portal-transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Try Again
        </button>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalDocumentsPageNew() {
  const { tenantSlug, isReady } = useTenantContext();
  const [documents, setDocuments] = React.useState<DocumentDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);

  // Animal context - only set if we have real placement data
  const animalName = primaryAnimal?.offspring?.name || null;
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  // Load primary animal context - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    const portalFetch = createPortalFetch(tenantSlug);
    let cancelled = false;

    async function loadAnimalContext() {
      try {
        const data = await portalFetch<{ placements: any[] }>("/portal/placements");
        if (cancelled) return;
        const placements = data.placements || [];
        if (placements.length > 0) {
          setPrimaryAnimal(placements[0]);
        }
      } catch (err) {
        // Silently ignore - animal context is optional for display
      }
    }
    loadAnimalContext();
    return () => { cancelled = true; };
  }, [tenantSlug, isReady]);

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    // Check if demo mode is active
    if (isDemoMode()) {
      const demoData = generateDemoData();
      // Convert demo documents to DocumentDTO format
      const demoDocuments: DocumentDTO[] = demoData.documents.map((d) => {
        // Map demo categories to DocumentCategory enum
        let category: DocumentCategory = "OTHER";
        if (d.category === "health") category = "HEALTH";
        else if (d.category === "pedigree") category = "PEDIGREE";
        else if (d.category === "contract") category = "CONTRACT";
        else if (d.category === "photo") category = "PHOTO";

        return {
          id: d.id,
          name: d.name,
          category,
          mimeType: d.type === "pdf" ? "application/pdf" : "application/octet-stream",
          fileSizeBytes: d.size,
          uploadedAt: d.uploadedAt,
          fileUrl: "#", // Demo placeholder
        };
      });
      setDocuments(demoDocuments);
      setPrimaryAnimal(demoData.placements[0]);
      setLoading(false);
      return;
    }

    // Normal API fetch
    try {
      const data = await api.portalData.getDocuments();
      setDocuments(data.documents || []);
    } catch (err: any) {
      console.error("[PortalDocumentsPageNew] Failed to fetch documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Group documents by category
  const healthDocs = documents.filter((d) => d.category === "HEALTH");
  const pedigreeDocs = documents.filter((d) => d.category === "PEDIGREE");
  const contractDocs = documents.filter((d) => d.category === "CONTRACT");
  const photoDocs = documents.filter((d) => d.category === "PHOTO");
  const otherDocs = documents.filter((d) => !d.category || d.category === "OTHER");

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <ErrorState error={error} onRetry={fetchDocuments} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Documents"
          subtitle={animalName ? `Important files for ${animalName}'s journey` : "Important files"}
          animalContext={animalName ?? undefined}
          status="info"
          statusLabel={`${documents.length} files`}
        />

        {/* Subject Header - Only show when we have real placement data */}
        {animalName && (
          <SubjectHeader
            name={animalName}
            species={species}
            breed={breed}
            statusLabel={`${documents.length} files`}
            statusVariant="neutral"
          />
        )}

        {/* Download notice */}
        <div
          style={{
            padding: "var(--portal-space-3)",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            textAlign: "center",
          }}
        >
          Documents are view-only. Contact your breeder for download access.
        </div>

        {/* Document Groups */}
        {documents.length === 0 ? (
          <EmptyDocuments />
        ) : (
          <>
            <DocumentGroup title="Health Records" documents={healthDocs} />
            <DocumentGroup title="Pedigree" documents={pedigreeDocs} />
            <DocumentGroup title="Contracts" documents={contractDocs} />
            <DocumentGroup title="Photos" documents={photoDocs} />
            <DocumentGroup title="Other Documents" documents={otherDocs} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
