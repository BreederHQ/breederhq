// apps/animals/src/components/NetworkAnimalPicker.tsx
// Network search panel for finding animals across the BreederHQ network

import React from "react";
import { makeApi } from "../api";
import type {
  NetworkAnimalResult,
  BreederSearchResult,
  ShareableAnimal,
  RegistryDTO,
  ParentType,
} from "@bhq/api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type SearchMethod = "gaid" | "exchange-code" | "registry" | "breeder";

type NetworkSearchResult = {
  animal: NetworkAnimalResult | ShareableAnimal;
  source: "direct" | "breeder";
  breederName?: string;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Animal Result Card
 * ───────────────────────────────────────────────────────────────────────────── */

function AnimalResultCard({
  animal,
  breederName,
  onSelect,
}: {
  animal: NetworkAnimalResult | ShareableAnimal;
  breederName?: string | null;
  onSelect: () => void;
}) {
  const name = animal.name || "Unknown";
  const sex = animal.sex;
  const photoUrl = "photoUrl" in animal ? animal.photoUrl : null;
  const gaid = "gaid" in animal ? animal.gaid : null;
  const registryNumbers = animal.registryNumbers || [];

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-hairline hover:border-accent/50 hover:bg-accent/5 transition-all text-left"
    >
      {/* Photo */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
          {sex === "MALE" ? "♂" : "♀"}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{name}</span>
          {gaid && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-secondary">
              {gaid}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          {animal.breed && <span>{animal.breed}</span>}
          {breederName && (
            <>
              <span>•</span>
              <span>{breederName}</span>
            </>
          )}
        </div>
        {registryNumbers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {registryNumbers.slice(0, 2).map((reg, i) => (
              <span key={i} className="text-[10px] px-1 py-0.5 rounded bg-white/5 text-secondary">
                {reg.registry}: {reg.number}
              </span>
            ))}
            {registryNumbers.length > 2 && (
              <span className="text-[10px] text-secondary">+{registryNumbers.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {/* Select indicator */}
      <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Breeder Result Card
 * ───────────────────────────────────────────────────────────────────────────── */

function BreederResultCard({
  breeder,
  onSelect,
}: {
  breeder: BreederSearchResult;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-hairline hover:border-accent/50 hover:bg-accent/5 transition-all text-left"
    >
      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
        🏠
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{breeder.tenantName}</div>
        <div className="text-xs text-secondary">
          {breeder.shareableAnimalCount} shareable animal{breeder.shareableAnimalCount !== 1 ? "s" : ""}
          {breeder.city && ` • ${breeder.city}`}
          {breeder.state && `, ${breeder.state}`}
        </div>
      </div>
      <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component: NetworkAnimalPicker
 * ───────────────────────────────────────────────────────────────────────────── */

export function NetworkAnimalPicker({
  sex,
  species,
  sourceAnimalId,
  relationshipType,
  onSelect,
  onBack,
}: {
  sex: "FEMALE" | "MALE";
  species?: string;
  sourceAnimalId: number;
  relationshipType: ParentType;
  onSelect: (animal: NetworkAnimalResult | ShareableAnimal, method: "gaid" | "exchange-code" | "registry" | "breeder", targetTenantId?: number) => void;
  onBack: () => void;
}) {
  const [searchMethod, setSearchMethod] = React.useState<SearchMethod>("breeder");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Search inputs
  const [gaidInput, setGaidInput] = React.useState("");
  const [exchangeCodeInput, setExchangeCodeInput] = React.useState("");
  const [registryId, setRegistryId] = React.useState<number | null>(null);
  const [registryNumInput, setRegistryNumInput] = React.useState("");
  const [breederSearchInput, setBreederSearchInput] = React.useState("");

  // Results
  const [searchResult, setSearchResult] = React.useState<NetworkAnimalResult | null>(null);
  const [breederResults, setBreederResults] = React.useState<BreederSearchResult[]>([]);
  const [selectedBreeder, setSelectedBreeder] = React.useState<BreederSearchResult | null>(null);
  const [breederAnimals, setBreederAnimals] = React.useState<ShareableAnimal[]>([]);

  // Confirmation state
  const [confirmAnimal, setConfirmAnimal] = React.useState<{
    animal: NetworkAnimalResult | ShareableAnimal;
    method: SearchMethod;
    targetTenantId?: number;
    breederName?: string;
  } | null>(null);

  // Registries list
  const [registries, setRegistries] = React.useState<RegistryDTO[]>([]);

  // Load registries on mount - use existing registries endpoint
  React.useEffect(() => {
    api.registries.list({ species })
      .then((data: any) => {
        // CONTRACT TOLERANCE: Accept either 'items' (canonical) or 'registries' (legacy)
        const rows = data?.items || data?.registries || [];
        setRegistries(rows);
      })
      .catch(console.error);
  }, [species]);

  // Clear results when method changes
  React.useEffect(() => {
    setSearchResult(null);
    setBreederResults([]);
    setSelectedBreeder(null);
    setBreederAnimals([]);
    setError(null);
  }, [searchMethod]);

  // Search handlers
  const handleGaidSearch = async () => {
    if (!gaidInput.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const result = await api.animalLinking.searchByGaid(gaidInput.trim());
      if (result) {
        // Validate sex matches
        if (result.sex !== sex) {
          setError(`This animal is ${result.sex.toLowerCase()}, but you need a ${sex.toLowerCase()} for ${relationshipType.toLowerCase()}`);
          return;
        }
        setSearchResult(result);
      } else {
        setError("No animal found with this GAID");
      }
    } catch (err) {
      console.error("GAID search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeCodeSearch = async () => {
    if (!exchangeCodeInput.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const result = await api.animalLinking.searchByExchangeCode(exchangeCodeInput.trim());
      if (result) {
        if (result.sex !== sex) {
          setError(`This animal is ${result.sex.toLowerCase()}, but you need a ${sex.toLowerCase()} for ${relationshipType.toLowerCase()}`);
          return;
        }
        setSearchResult(result);
      } else {
        setError("No animal found with this code, or the code has expired");
      }
    } catch (err) {
      console.error("Exchange code search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrySearch = async () => {
    if (!registryId || !registryNumInput.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const result = await api.animalLinking.searchByRegistry(registryId, registryNumInput.trim());
      if (result) {
        if (result.sex !== sex) {
          setError(`This animal is ${result.sex.toLowerCase()}, but you need a ${sex.toLowerCase()} for ${relationshipType.toLowerCase()}`);
          return;
        }
        setSearchResult(result);
      } else {
        setError("No animal found with this registry number");
      }
    } catch (err) {
      console.error("Registry search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBreederSearch = async () => {
    if (!breederSearchInput.trim() || breederSearchInput.trim().length < 3) {
      setError("Enter at least 3 characters to search");
      return;
    }
    setLoading(true);
    setError(null);
    setBreederResults([]);
    setSelectedBreeder(null);
    try {
      const results = await api.animalLinking.searchBreeder(breederSearchInput.trim());
      if (results.length === 0) {
        setError("No breeders found matching your search");
      } else {
        setBreederResults(results);
      }
    } catch (err) {
      console.error("Breeder search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBreeder = async (breeder: BreederSearchResult) => {
    setSelectedBreeder(breeder);
    setLoading(true);
    setError(null);
    try {
      const animals = await api.animalLinking.getBreederAnimals(breeder.tenantId, {
        sex,
        species: species as any,
      });
      if (animals.length === 0) {
        setError(`No ${sex.toLowerCase()}s available from this breeder`);
      }
      setBreederAnimals(animals);
    } catch (err) {
      console.error("Failed to load breeder animals:", err);
      setError("Failed to load breeder's animals");
    } finally {
      setLoading(false);
    }
  };

  // Filter registries by species if provided
  const filteredRegistries = species
    ? registries.filter((r) => !r.species || r.species === species)
    : registries;

  // Handler to show confirmation before linking
  const handleRequestConfirmation = (
    animal: NetworkAnimalResult | ShareableAnimal,
    method: SearchMethod,
    targetTenantId?: number,
    breederName?: string
  ) => {
    setConfirmAnimal({ animal, method, targetTenantId, breederName });
  };

  // Handler to confirm and create link
  const handleConfirmLink = () => {
    if (!confirmAnimal) return;
    onSelect(confirmAnimal.animal, confirmAnimal.method, confirmAnimal.targetTenantId);
    setConfirmAnimal(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold">Network Search</h3>
        </div>
        <p className="text-xs text-secondary">
          Search for a {sex.toLowerCase()} from another breeder to link as {relationshipType.toLowerCase()}
        </p>
      </div>

      {/* Search method tabs */}
      <div className="flex border-b border-hairline">
        {[
          { key: "breeder", label: "Find Breeder" },
          { key: "gaid", label: "GAID" },
          { key: "exchange-code", label: "Exchange Code" },
          { key: "registry", label: "Registry #" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSearchMethod(key as SearchMethod)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              searchMethod === key
                ? "text-accent border-b-2 border-accent bg-accent/5"
                : "text-secondary hover:text-primary hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input area */}
      <div className="p-4 border-b border-hairline">
        {searchMethod === "gaid" && (
          <div className="space-y-2">
            <label className="text-xs text-secondary">Enter Global Animal ID (GAID)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="DOG-XXXX-XXXX-XXXX"
                value={gaidInput}
                onChange={(e) => setGaidInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                onKeyDown={(e) => e.key === "Enter" && handleGaidSearch()}
              />
              <button
                onClick={handleGaidSearch}
                disabled={loading || !gaidInput.trim()}
                className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {searchMethod === "exchange-code" && (
          <div className="space-y-2">
            <label className="text-xs text-secondary">Enter Exchange Code (from breeder)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="DUKE-1234"
                value={exchangeCodeInput}
                onChange={(e) => setExchangeCodeInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                onKeyDown={(e) => e.key === "Enter" && handleExchangeCodeSearch()}
              />
              <button
                onClick={handleExchangeCodeSearch}
                disabled={loading || !exchangeCodeInput.trim()}
                className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {searchMethod === "registry" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-secondary">Registry</label>
              <select
                value={registryId ?? ""}
                onChange={(e) => setRegistryId(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select registry...</option>
                {filteredRegistries.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code ? `${r.code} - ${r.name}` : r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary">Registration Number</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Enter registration number"
                  value={registryNumInput}
                  onChange={(e) => setRegistryNumInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  onKeyDown={(e) => e.key === "Enter" && handleRegistrySearch()}
                />
                <button
                  onClick={handleRegistrySearch}
                  disabled={loading || !registryId || !registryNumInput.trim()}
                  className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {searchMethod === "breeder" && !selectedBreeder && (
          <div className="space-y-2">
            <label className="text-xs text-secondary">Search by breeder email or name</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Email or breeder name..."
                value={breederSearchInput}
                onChange={(e) => setBreederSearchInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                onKeyDown={(e) => e.key === "Enter" && handleBreederSearch()}
              />
              <button
                onClick={handleBreederSearch}
                disabled={loading || breederSearchInput.trim().length < 3}
                className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {searchMethod === "breeder" && selectedBreeder && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedBreeder(null);
                setBreederAnimals([]);
              }}
              className="p-1 rounded hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="text-sm font-medium">{selectedBreeder.tenantName}</div>
              <div className="text-xs text-secondary">
                {breederAnimals.length} {sex.toLowerCase()}{breederAnimals.length !== 1 ? "s" : ""} available
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="text-center py-8 text-secondary animate-pulse">Searching...</div>
        )}

        {/* Direct search result (GAID, Exchange Code, Registry) */}
        {!loading && searchResult && (searchMethod === "gaid" || searchMethod === "exchange-code" || searchMethod === "registry") && (
          <div className="space-y-3">
            <div className="text-xs text-secondary font-medium">Found Animal</div>
            <AnimalResultCard
              animal={searchResult}
              breederName={searchResult.tenantName}
              onSelect={() => handleRequestConfirmation(searchResult, searchMethod, searchResult.tenantId, searchResult.tenantName ?? undefined)}
            />
          </div>
        )}

        {/* Breeder search results */}
        {!loading && searchMethod === "breeder" && !selectedBreeder && breederResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-secondary font-medium">
              {breederResults.length} breeder{breederResults.length !== 1 ? "s" : ""} found
            </div>
            {breederResults.map((breeder) => (
              <BreederResultCard
                key={breeder.tenantId}
                breeder={breeder}
                onSelect={() => handleSelectBreeder(breeder)}
              />
            ))}
          </div>
        )}

        {/* Breeder's animals */}
        {!loading && searchMethod === "breeder" && selectedBreeder && breederAnimals.length > 0 && (
          <div className="space-y-2">
            {breederAnimals.map((animal) => (
              <AnimalResultCard
                key={animal.id}
                animal={animal}
                onSelect={() => handleRequestConfirmation(animal, "breeder", selectedBreeder.tenantId, selectedBreeder.tenantName)}
              />
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && !searchResult && breederResults.length === 0 && breederAnimals.length === 0 && (
          <div className="text-center py-8 text-secondary text-sm">
            {searchMethod === "gaid" && "Enter a GAID to search"}
            {searchMethod === "exchange-code" && "Enter an exchange code from the breeder"}
            {searchMethod === "registry" && "Select a registry and enter the number"}
            {searchMethod === "breeder" && !selectedBreeder && "Search for a breeder by email or name"}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-3 border-t border-hairline bg-surface/50">
        <p className="text-[10px] text-secondary text-center">
          Selecting an animal will create a link request that the owner must approve
        </p>
      </div>

      {/* Confirmation Modal */}
      {confirmAnimal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
          <div className="bg-surface border border-hairline rounded-lg shadow-xl max-w-sm w-full p-4">
            <h4 className="text-sm font-semibold mb-3">Confirm Link Request</h4>
            <div className="rounded-lg border border-hairline p-3 mb-4">
              <div className="flex items-center gap-3">
                {("photoUrl" in confirmAnimal.animal && confirmAnimal.animal.photoUrl) ? (
                  <img
                    src={confirmAnimal.animal.photoUrl}
                    alt={confirmAnimal.animal.name || "Animal"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                    {confirmAnimal.animal.sex === "MALE" ? "♂" : "♀"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{confirmAnimal.animal.name || "Unknown"}</div>
                  <div className="text-xs text-secondary">
                    {confirmAnimal.breederName && <span>{confirmAnimal.breederName}</span>}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-secondary mb-4">
              Are you sure you want to request <span className="font-medium">{confirmAnimal.animal.name || "this animal"}</span> as the <span className="text-accent font-medium">{relationshipType.toLowerCase()}</span>?
            </p>
            <p className="text-xs text-secondary mb-4 bg-white/5 p-2 rounded">
              This will send a link request to <span className="font-medium">{confirmAnimal.breederName || "the owner"}</span>. They must approve it before the lineage link is created.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAnimal(null)}
                className="flex-1 px-4 py-2 rounded-md border border-hairline text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLink}
                className="flex-1 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkAnimalPicker;
