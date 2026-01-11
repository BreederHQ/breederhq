// apps/portal/src/pages/PortalDiagnosticsPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { SectionCard } from "../design/SectionCard";
import { buildApiPath, getTenantSlug } from "../derived/tenantContext";

// Keys to sanitize from any JSON object
const SENSITIVE_KEYS = [
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "cookie",
  "csrf",
  "email",
  "password",
];

/**
 * Deep sanitize an object by removing sensitive keys
 */
function sanitizeDeep<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeDeep(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => keyLower.includes(sensitive))) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = sanitizeDeep(value);
    }
  }
  return result as T;
}

/**
 * Pick the first non-dog subject from a list
 */
function pickNonDogSubject(subjects: Array<{ offspring?: { species?: string } }>): unknown | null {
  for (const subject of subjects) {
    const species = subject.offspring?.species?.toLowerCase();
    if (species && species !== "dog") {
      return subject;
    }
  }
  // If no non-dog found, return the first subject anyway
  return subjects[0] || null;
}

interface EndpointResult {
  url: string;
  method: string;
  status: number | "error";
  ok: boolean;
}

/**
 * Probe an endpoint and return its status
 */
async function probeEndpoint(url: string, method: string = "GET"): Promise<EndpointResult> {
  try {
    const tenantSlug = getTenantSlug();
    // Build URL with tenant slug in path for tenant-scoped endpoints
    const fullUrl = url.startsWith("/api/v1/portal/") && tenantSlug
      ? url.replace("/api/v1/portal/", `/api/v1/t/${tenantSlug}/portal/`)
      : url;
    const headers: Record<string, string> = { Accept: "application/json" };
    const response = await fetch(fullUrl, {
      method,
      credentials: "include",
      headers,
    });
    return {
      url,
      method,
      status: response.status,
      ok: response.ok,
    };
  } catch {
    return {
      url,
      method,
      status: "error",
      ok: false,
    };
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "var(--portal-space-2) var(--portal-space-3)",
        fontSize: "var(--portal-font-size-xs)",
        fontWeight: "var(--portal-font-weight-medium)",
        color: copied ? "var(--portal-text-success)" : "var(--portal-text-secondary)",
        background: "var(--portal-bg-elevated)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-sm)",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

function JsonBlock({ data, title }: { data: unknown; title: string }) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--portal-space-2)",
        }}
      >
        <span
          style={{
            fontSize: "var(--portal-font-size-xs)",
            color: "var(--portal-text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        <CopyButton text={jsonString} label="Copy JSON" />
      </div>
      <pre
        style={{
          margin: 0,
          padding: "var(--portal-space-3)",
          background: "var(--portal-bg-subtle)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-sm)",
          fontSize: "var(--portal-font-size-xs)",
          fontFamily: "monospace",
          color: "var(--portal-text-secondary)",
          overflow: "auto",
          maxHeight: "300px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {jsonString}
      </pre>
    </div>
  );
}

export default function PortalDiagnosticsPage() {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [sessionData, setSessionData] = React.useState<unknown>(null);
  const [subjectData, setSubjectData] = React.useState<unknown>(null);
  const [endpoints, setEndpoints] = React.useState<EndpointResult[]>([]);

  // Check query param gate
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.get("enable") === "1");
  }, []);

  // Load diagnostics data
  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    async function loadDiagnostics() {
      setLoading(true);

      // Block A: Session data
      let sessionResult: unknown = null;
      try {
        const sessionRes = await fetch("/api/v1/session", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (sessionRes.ok) {
          sessionResult = await sessionRes.json();
        } else {
          sessionResult = { error: `HTTP ${sessionRes.status}` };
        }
      } catch {
        sessionResult = { error: "Failed to fetch session" };
      }
      setSessionData(sanitizeDeep(sessionResult));

      // Block B: Subject data (try placements first, then offspring)
      let subjects: Array<{ offspring?: { species?: string } }> = [];
      const tenantSlug = getTenantSlug();
      const diagHeaders: Record<string, string> = { Accept: "application/json" };
      try {
        // Try placements endpoint first
        const placementsRes = await fetch(buildApiPath("/portal/placements", tenantSlug), {
          credentials: "include",
          headers: diagHeaders,
        });
        if (placementsRes.ok) {
          const placementsData = await placementsRes.json();
          subjects = placementsData.data || placementsData || [];
        }
      } catch {
        // Fallback to offspring endpoint
        try {
          const offspringRes = await fetch(buildApiPath("/portal/offspring", tenantSlug), {
            credentials: "include",
            headers: diagHeaders,
          });
          if (offspringRes.ok) {
            const offspringData = await offspringRes.json();
            subjects = offspringData.data || offspringData || [];
          }
        } catch {
          subjects = [];
        }
      }

      const primarySubject = pickNonDogSubject(subjects);
      setSubjectData(primarySubject ? sanitizeDeep(primarySubject) : { note: "No subjects found" });

      // Block C: Endpoint truth table
      const endpointProbes = await Promise.all([
        probeEndpoint("/api/v1/session", "GET"),
        probeEndpoint(buildApiPath("/portal/placements", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/offspring", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/threads", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/messages", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/invoices", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/financials", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/agreements", tenantSlug), "GET"),
        probeEndpoint(buildApiPath("/portal/documents", tenantSlug), "GET"),
      ]);
      setEndpoints(endpointProbes);

      setLoading(false);
    }

    loadDiagnostics();
  }, [enabled]);

  // Gate: not enabled
  if (!enabled) {
    return (
      <PageContainer>
        <div
          style={{
            textAlign: "center",
            padding: "var(--portal-space-8)",
            color: "var(--portal-text-tertiary)",
          }}
        >
          <p style={{ margin: 0 }}>Diagnostics not available.</p>
        </div>
      </PageContainer>
    );
  }

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <h1
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            marginBottom: "var(--portal-space-4)",
          }}
        >
          Diagnostics
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "150px",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-lg)",
              }}
            />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          marginBottom: "var(--portal-space-2)",
        }}
      >
        Diagnostics
      </h1>

      {/* Warning banner */}
      <div
        style={{
          padding: "var(--portal-space-3)",
          background: "var(--portal-bg-warning-subtle)",
          border: "1px solid var(--portal-border-warning)",
          borderRadius: "var(--portal-radius-md)",
          marginBottom: "var(--portal-space-4)",
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-text-warning)",
        }}
      >
        Internal diagnostics — do not share externally.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Block A: Session */}
        <SectionCard title="Block A: Session & Identity">
          <JsonBlock data={sessionData} title="Session Data (Sanitized)" />
        </SectionCard>

        {/* Block B: Subject */}
        <SectionCard title="Block B: Primary Subject Record">
          <JsonBlock data={subjectData} title="First Non-Dog Subject (Sanitized)" />
        </SectionCard>

        {/* Block C: Endpoint Truth Table */}
        <SectionCard title="Block C: Endpoint Truth Table">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "var(--portal-space-2)",
            }}
          >
            <CopyButton
              text={endpoints
                .map((e) => `${e.method} ${e.url} → ${e.status} ${e.ok ? "OK" : "FAIL"}`)
                .join("\n")}
              label="Copy List"
            />
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "var(--portal-space-2)",
            }}
          >
            {endpoints.map((endpoint, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--portal-space-2)",
                  padding: "var(--portal-space-2)",
                  background: "var(--portal-bg-subtle)",
                  borderRadius: "var(--portal-radius-sm)",
                  fontSize: "var(--portal-font-size-sm)",
                  fontFamily: "monospace",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: endpoint.ok
                      ? "var(--portal-text-success)"
                      : "var(--portal-text-error)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--portal-text-tertiary)", width: "40px" }}>
                  {endpoint.method}
                </span>
                <span style={{ color: "var(--portal-text-primary)", flex: 1 }}>{endpoint.url}</span>
                <span
                  style={{
                    color: endpoint.ok ? "var(--portal-text-success)" : "var(--portal-text-error)",
                    fontWeight: "var(--portal-font-weight-medium)",
                  }}
                >
                  {endpoint.status}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
