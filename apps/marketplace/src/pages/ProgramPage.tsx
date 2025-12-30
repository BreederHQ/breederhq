// apps/marketplace/src/pages/ProgramPage.tsx
import * as React from "react";
import { PageHeader, SectionCard, EmptyState } from "@bhq/ui";
import { publicMarketplaceApi } from "../api";
import type {
  PublicProgramDTO,
  PublicOffspringGroupSummary,
  PublicAnimalSummary,
  ApiError,
} from "../types";
import { ListingCard } from "../components/ListingCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

type ProgramPageProps = {
  programSlug: string;
  onNavigate: (path: string) => void;
};

type LoadState = "loading" | "success" | "not-found" | "gate-disabled" | "error";

export function ProgramPage({ programSlug, onNavigate }: ProgramPageProps) {
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [program, setProgram] = React.useState<PublicProgramDTO | null>(null);
  const [offspringGroups, setOffspringGroups] = React.useState<PublicOffspringGroupSummary[]>([]);
  const [animals, setAnimals] = React.useState<PublicAnimalSummary[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  // Prevent duplicate fetches on re-render
  const fetchedSlugRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Skip if we already fetched this slug
    if (fetchedSlugRef.current === programSlug && loadState !== "loading") {
      return;
    }

    let cancelled = false;
    fetchedSlugRef.current = programSlug;

    async function load() {
      setLoadState("loading");
      try {
        // Parallel fetch for all data
        const [programData, groupsData, animalsData] = await Promise.all([
          publicMarketplaceApi.programs.get(programSlug),
          publicMarketplaceApi.programs.listOffspringGroups(programSlug).catch(() => ({ items: [] })),
          publicMarketplaceApi.programs.listAnimals(programSlug).catch(() => ({ items: [] })),
        ]);

        if (cancelled) return;

        setProgram(programData);
        setOffspringGroups(groupsData.items || []);
        setAnimals(animalsData.items || []);
        setLoadState("success");
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 404) {
          // Check if gate is disabled based on error message
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
  }, [programSlug, loadState]);

  if (loadState === "loading") {
    return <LoadingState variant="program" />;
  }

  if (loadState === "not-found") {
    return (
      <ErrorState
        type="not-found"
        onBack={() => onNavigate("/marketplace")}
      />
    );
  }

  if (loadState === "gate-disabled") {
    return (
      <ErrorState
        type="gate-disabled"
        onBack={() => onNavigate("/marketplace")}
      />
    );
  }

  if (loadState === "error" || !program) {
    return (
      <ErrorState
        type="error"
        message={errorMessage}
        onBack={() => onNavigate("/marketplace")}
      />
    );
  }

  const location = [program.location?.city, program.location?.region, program.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="p-6 space-y-6">
      {/* Program Header */}
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center">
          {program.photoUrl ? (
            <img src={program.photoUrl} alt={program.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl opacity-50">🏠</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <PageHeader
            title={program.name}
            subtitle={location || program.species || undefined}
          />
        </div>
      </div>

      {/* Bio */}
      {program.bio && (
        <SectionCard title="About">
          <p className="text-sm text-secondary whitespace-pre-wrap">{program.bio}</p>
        </SectionCard>
      )}

      {/* Contact */}
      {program.publicContactEmail && (
        <SectionCard title="Contact">
          <a
            href={`mailto:${program.publicContactEmail}`}
            className="text-sm text-[hsl(var(--brand-teal))] hover:underline"
          >
            {program.publicContactEmail}
          </a>
        </SectionCard>
      )}

      {/* Offspring Groups Section */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">🐾</span>
            <span>Litters & Offspring Groups</span>
          </div>
        }
      >
        {offspringGroups.length === 0 ? (
          <EmptyState
            title="No listings yet"
            hint="This program hasn't listed any litters or offspring groups."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {offspringGroups.map((group) => (
              <ListingCard
                key={group.id}
                type="offspring-group"
                programSlug={programSlug}
                item={group}
                onClick={() => onNavigate(`/marketplace/programs/${programSlug}/offspring-groups/${group.slug}`)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Animals Section */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">🐕</span>
            <span>Animals</span>
          </div>
        }
      >
        {animals.length === 0 ? (
          <EmptyState
            title="No animals listed"
            hint="This program hasn't listed any animals."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {animals.map((animal) => (
              <ListingCard
                key={animal.id}
                type="animal"
                programSlug={programSlug}
                item={animal}
                onClick={() => onNavigate(`/marketplace/programs/${programSlug}/animals/${animal.urlSlug}`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
