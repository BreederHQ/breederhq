// apps/marketplace/src/pages/AnimalDetailPage.tsx
import * as React from "react";
import { PageHeader, SectionCard, Button, Badge } from "@bhq/ui";
import { publicMarketplaceApi } from "../api";
import type { PublicAnimalDTO, ApiError } from "../types";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { CompactEmptyState } from "../components/CompactEmptyState";

type AnimalDetailPageProps = {
  programSlug: string;
  urlSlug: string;
  onNavigate: (path: string) => void;
};

type LoadState = "loading" | "success" | "not-found" | "gate-disabled" | "error";

export function AnimalDetailPage({ programSlug, urlSlug, onNavigate }: AnimalDetailPageProps) {
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [animal, setAnimal] = React.useState<PublicAnimalDTO | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  // Prevent duplicate fetches on re-render
  const fetchedKeyRef = React.useRef<string | null>(null);
  const fetchKey = `${programSlug}:${urlSlug}`;

  React.useEffect(() => {
    // Skip if we already fetched this key
    if (fetchedKeyRef.current === fetchKey && loadState !== "loading") {
      return;
    }

    let cancelled = false;
    fetchedKeyRef.current = fetchKey;

    async function load() {
      setLoadState("loading");
      try {
        const data = await publicMarketplaceApi.programs.getAnimal(programSlug, urlSlug);
        if (cancelled) return;
        setAnimal(data);
        setLoadState("success");
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 404) {
          const errData = apiErr.data as Record<string, unknown> | undefined;
          if (errData?.code === "MARKETPLACE_DISABLED" || String(errData?.message || "").toLowerCase().includes("not enabled")) {
            setLoadState("gate-disabled");
          } else {
            setLoadState("not-found");
          }
        } else {
          setErrorMessage(apiErr.message);
          setLoadState("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [programSlug, urlSlug, fetchKey, loadState]);

  const handleBack = () => {
    onNavigate(`/marketplace/programs/${programSlug}`);
  };

  if (loadState === "loading") {
    return <LoadingState variant="detail" />;
  }

  if (loadState === "not-found") {
    return <ErrorState type="not-found" onBack={handleBack} />;
  }

  if (loadState === "gate-disabled") {
    return <ErrorState type="gate-disabled" onBack={handleBack} />;
  }

  if (loadState === "error" || !animal) {
    return <ErrorState type="error" message={errorMessage} onBack={handleBack} />;
  }

  const subtitle = [
    animal.breed,
    animal.sex?.toLowerCase(),
    animal.birthDate ? `Born ${formatDate(animal.birthDate)}` : null,
  ].filter(Boolean).join(" • ");

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Program
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center">
          {animal.photoUrl ? (
            <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl opacity-50">{animal.sex === "MALE" ? "♂" : animal.sex === "FEMALE" ? "♀" : "🐕"}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <PageHeader
            title={animal.name}
            subtitle={subtitle}
            actions={
              animal.status ? (
                <Badge variant={getStatusVariant(animal.status)}>{animal.status}</Badge>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Details Grid */}
      <SectionCard title="Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {animal.species && (
            <DetailItem label="Species" value={animal.species} />
          )}
          {animal.breed && (
            <DetailItem label="Breed" value={animal.breed} />
          )}
          {animal.sex && (
            <DetailItem label="Sex" value={animal.sex === "MALE" ? "Male" : "Female"} />
          )}
          {animal.color && (
            <DetailItem label="Color" value={animal.color} />
          )}
          {animal.birthDate && (
            <DetailItem label="Birth Date" value={formatDate(animal.birthDate)} />
          )}
        </div>
      </SectionCard>

      {/* Description */}
      {animal.description && (
        <SectionCard title="Description">
          <p className="text-sm text-secondary whitespace-pre-wrap">{animal.description}</p>
        </SectionCard>
      )}

      {/* Registrations */}
      <SectionCard title="Registrations">
        {!animal.registrations || animal.registrations.length === 0 ? (
          <CompactEmptyState message="No registrations on file" />
        ) : (
          <div className="space-y-2">
            {animal.registrations.map((reg, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface-strong/30">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-teal))]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[hsl(var(--brand-teal))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-primary">{reg.registryName}</div>
                  <div className="text-xs text-secondary font-mono">{reg.identifier}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Titles */}
      <SectionCard title="Titles & Achievements">
        {!animal.titles || animal.titles.length === 0 ? (
          <CompactEmptyState message="No titles on file" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {animal.titles.map((title, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/20"
              >
                <span className="text-sm font-medium text-primary">{title.title}</span>
                {title.organization && (
                  <span className="text-xs text-secondary">({title.organization})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Health Tests */}
      <SectionCard title="Health Testing">
        {!animal.healthTests || animal.healthTests.length === 0 ? (
          <CompactEmptyState message="No health tests on file" />
        ) : (
          <div className="space-y-2">
            {animal.healthTests.map((test, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-strong/30">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-primary">{test.testName}</div>
                    {test.date && <div className="text-xs text-secondary">{formatDate(test.date)}</div>}
                  </div>
                </div>
                {test.result && (
                  <Badge variant="green">{test.result}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-secondary uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-medium text-primary">{value}</div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStatusVariant(status: string): "amber" | "green" | "red" | undefined {
  const s = status.toLowerCase();
  if (s.includes("available")) return "green";
  if (s.includes("reserved") || s.includes("pending")) return "amber";
  if (s.includes("sold") || s.includes("placed")) return undefined;
  return undefined;
}
