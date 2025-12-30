// apps/marketplace/src/pages/OffspringGroupDetailPage.tsx
import * as React from "react";
import { PageHeader, SectionCard, Button, Badge, EmptyState } from "@bhq/ui";
import { publicMarketplaceApi } from "../api";
import type { PublicOffspringGroupDTO, ApiError } from "../types";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

type OffspringGroupDetailPageProps = {
  programSlug: string;
  listingSlug: string;
  onNavigate: (path: string) => void;
};

type LoadState = "loading" | "success" | "not-found" | "gate-disabled" | "error";

export function OffspringGroupDetailPage({ programSlug, listingSlug, onNavigate }: OffspringGroupDetailPageProps) {
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [group, setGroup] = React.useState<PublicOffspringGroupDTO | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  // Prevent duplicate fetches on re-render
  const fetchedKeyRef = React.useRef<string | null>(null);
  const fetchKey = `${programSlug}:${listingSlug}`;

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
        const data = await publicMarketplaceApi.programs.getOffspringGroup(programSlug, listingSlug);
        if (cancelled) return;
        setGroup(data);
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
  }, [programSlug, listingSlug, fetchKey, loadState]);

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

  if (loadState === "error" || !group) {
    return <ErrorState type="error" message={errorMessage} onBack={handleBack} />;
  }

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
        <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center">
          {group.photoUrl ? (
            <img src={group.photoUrl} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl opacity-50">🐾</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <PageHeader
            title={group.name}
            subtitle={formatDateRange(group.expectedDate, group.birthDate)}
            actions={
              group.status ? (
                <Badge variant={getStatusVariant(group.status)}>{group.status}</Badge>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <SectionCard title="Description">
          <p className="text-sm text-secondary whitespace-pre-wrap">{group.description}</p>
        </SectionCard>
      )}

      {/* Parents */}
      {(group.sire || group.dam) && (
        <SectionCard title="Parents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.sire && (
              <ParentCard
                label="Sire"
                name={group.sire.name}
                breed={group.sire.breed}
                photoUrl={group.sire.photoUrl}
                onClick={group.sire.urlSlug ? () => onNavigate(`/marketplace/programs/${programSlug}/animals/${group.sire!.urlSlug}`) : undefined}
              />
            )}
            {group.dam && (
              <ParentCard
                label="Dam"
                name={group.dam.name}
                breed={group.dam.breed}
                photoUrl={group.dam.photoUrl}
                onClick={group.dam.urlSlug ? () => onNavigate(`/marketplace/programs/${programSlug}/animals/${group.dam!.urlSlug}`) : undefined}
              />
            )}
          </div>
        </SectionCard>
      )}

      {/* Offspring */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span>Offspring</span>
            {group.offspring && group.offspring.length > 0 && (
              <span className="text-xs text-secondary">({group.offspring.length})</span>
            )}
          </div>
        }
      >
        {!group.offspring || group.offspring.length === 0 ? (
          <EmptyState
            title="No offspring listed"
            hint="Offspring haven't been added to this litter yet."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.offspring.map((pup) => (
              <OffspringCard
                key={pup.id}
                name={pup.name}
                sex={pup.sex}
                status={pup.status}
                color={pup.color}
                photoUrl={pup.photoUrl}
                onClick={pup.urlSlug ? () => onNavigate(`/marketplace/programs/${programSlug}/animals/${pup.urlSlug}`) : undefined}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ParentCard({
  label,
  name,
  breed,
  photoUrl,
  onClick,
}: {
  label: string;
  name: string;
  breed?: string | null;
  photoUrl?: string | null;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border border-hairline bg-surface ${onClick ? "hover:border-[hsl(var(--brand-orange))]/40 cursor-pointer" : ""} transition-colors text-left w-full`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl opacity-50">🐕</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-secondary uppercase tracking-wide">{label}</div>
        <div className="font-semibold text-sm text-primary truncate">{name}</div>
        {breed && <div className="text-xs text-secondary truncate">{breed}</div>}
      </div>
      {onClick && (
        <svg className="w-4 h-4 text-secondary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </Comp>
  );
}

function OffspringCard({
  name,
  sex,
  status,
  color,
  photoUrl,
  onClick,
}: {
  name?: string | null;
  sex?: "MALE" | "FEMALE" | null;
  status?: string | null;
  color?: string | null;
  photoUrl?: string | null;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  const displayName = name || (sex === "MALE" ? "Male" : sex === "FEMALE" ? "Female" : "Offspring");

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-col items-center p-3 rounded-lg border border-hairline bg-surface ${onClick ? "hover:border-[hsl(var(--brand-orange))]/40 cursor-pointer" : ""} transition-colors text-center`}
    >
      <div className="w-14 h-14 rounded-full bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center mb-2">
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-50">{sex === "MALE" ? "♂" : sex === "FEMALE" ? "♀" : "🐾"}</span>
        )}
      </div>
      <div className="font-medium text-sm text-primary truncate w-full">{displayName}</div>
      {color && <div className="text-xs text-secondary truncate w-full">{color}</div>}
      {status && (
        <div className="mt-1">
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-surface-strong/70 text-secondary border border-hairline">
            {status}
          </span>
        </div>
      )}
    </Comp>
  );
}

function formatDateRange(expectedDate?: string | null, birthDate?: string | null): string {
  const parts: string[] = [];
  if (birthDate) {
    parts.push(`Born: ${formatDate(birthDate)}`);
  } else if (expectedDate) {
    parts.push(`Expected: ${formatDate(expectedDate)}`);
  }
  return parts.join(" • ");
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
