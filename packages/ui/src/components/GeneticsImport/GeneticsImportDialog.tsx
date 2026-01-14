import * as React from "react";
import { Dialog } from "../Dialog/Dialog";
import { Button } from "../Button/Button";
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Dna, Heart, Scale, GitBranch } from "lucide-react";

// Helper to get CSRF token from cookie
function getCsrfToken(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Types for genetics import
export type GeneticsProvider = "embark" | "wisdom_panel" | "uc_davis" | "animal_genetics" | "paw_print" | "manual";

export interface ProviderInfo {
  id: GeneticsProvider;
  name: string;
  species: string[];
  supportedFormats: string[];
  isSupported: boolean;
  exportInstructions?: string;
}

export interface ParsedLocus {
  locus: string;
  locusName: string;
  allele1?: string;
  allele2?: string;
  genotype: string;
}

// Extended data types from Embark
export interface BreedCompositionEntry {
  breed: string;
  percentage: number;
}

export interface COIData {
  coefficient: number;
  percentage: number;
  riskLevel: "excellent" | "good" | "moderate" | "high" | "critical";
}

export interface MHCDiversity {
  drb1Alleles?: number;
  dqa1Dqb1Alleles?: number;
}

export interface GeneticLineage {
  mtHaplotype?: string;
  mtHaplogroup?: string;
  yHaplotype?: string;
  yHaplogroup?: string;
}

export interface ExtendedGeneticData {
  dogIdentity?: {
    name?: string;
    sex?: string;
    swabCode?: string;
  };
  breedName?: string;
  breedComposition?: BreedCompositionEntry[];
  coi?: COIData;
  mhcDiversity?: MHCDiversity;
  lineage?: GeneticLineage;
  predictedAdultWeight?: {
    value: number;
    unit: "lbs" | "kg";
  };
  lifeStage?: string;
}

export interface PreviewResult {
  success: boolean;
  provider: string;
  summary: {
    coatColor: number;
    coatType: number;
    physicalTraits: number;
    eyeColor: number;
    health: number;
    otherTraits: number;
    unmapped: number;
    total: number;
  };
  preview: {
    coatColor: ParsedLocus[];
    coatType: ParsedLocus[];
    physicalTraits: ParsedLocus[];
    eyeColor: ParsedLocus[];
    health: ParsedLocus[];
    otherTraits: ParsedLocus[];
  };
  unmapped: Array<{ category: string; name: string; value: string }>;
  warnings: string[];
  // Extended data from Embark
  extended?: ExtendedGeneticData;
}

export interface ImportResult {
  success: boolean;
  imported: {
    coatColor: number;
    health: number;
    coatType: number;
    physicalTraits: number;
    eyeColor: number;
    otherTraits: number;
  };
  warnings: string[];
  /** Number of new markers flagged for admin review */
  newMarkersPendingReview?: number;
  // Extended data that was imported
  extended?: ExtendedGeneticData;
}

interface GeneticsImportDialogProps {
  open: boolean;
  onClose: () => void;
  animalId: number;
  animalName: string;
  animalSpecies: string;
  baseUrl?: string;
  onImportComplete?: (result: ImportResult) => void;
}

// Default providers - can be fetched from API
const DEFAULT_PROVIDERS: ProviderInfo[] = [
  {
    id: "embark",
    name: "Embark",
    species: ["DOG"],
    supportedFormats: ["CSV", "TSV"],
    isSupported: true,
    exportInstructions: `How to download from Embark:
1. Log into embarkvet.com and go to your dog's results
2. Scroll down and click "Raw Data" under "Print or Download Results"
3. Scroll past the TPED/TFAM section to "Machine-readable results file"
4. Click "Download as CSV" or "Download as TSV"

Important: Download the CSV/TSV file, NOT the "Raw DNA" zip file (TPED/TFAM). The CSV/TSV contains all interpreted health and trait results. The TPED/TFAM files contain unprocessed genetic markers for research use only.`,
  },
  {
    id: "wisdom_panel",
    name: "Wisdom Panel",
    species: ["DOG", "CAT"],
    supportedFormats: ["PDF"],
    isSupported: false,
    exportInstructions: "Coming soon - PDF parsing support",
  },
  {
    id: "uc_davis",
    name: "UC Davis VGL",
    species: ["DOG", "CAT", "HORSE"],
    supportedFormats: ["PDF"],
    isSupported: false,
    exportInstructions: "Coming soon - PDF parsing support",
  },
  {
    id: "paw_print",
    name: "Paw Print Genetics",
    species: ["DOG", "CAT"],
    supportedFormats: ["PDF"],
    isSupported: false,
    exportInstructions: "Coming soon - PDF parsing support",
  },
];

export function GeneticsImportDialog({
  open,
  onClose,
  animalId,
  animalName,
  animalSpecies,
  baseUrl = "/api/v1",
  onImportComplete,
}: GeneticsImportDialogProps) {
  const [step, setStep] = React.useState<"select" | "upload" | "preview" | "importing" | "done">("select");
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderInfo | null>(null);
  const [fileContent, setFileContent] = React.useState<string>("");
  const [fileName, setFileName] = React.useState<string>("");
  const [previewResult, setPreviewResult] = React.useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [mergeStrategy, setMergeStrategy] = React.useState<"replace" | "merge">("replace");
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(["coatColor", "health"]));
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter providers by species
  const availableProviders = DEFAULT_PROVIDERS.filter(
    (p) => p.species.includes(animalSpecies.toUpperCase())
  );

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedProvider(null);
      setFileContent("");
      setFileName("");
      setPreviewResult(null);
      setImportResult(null);
      setError("");
      setMergeStrategy("replace");
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const content = await file.text();
      setFileContent(content);
    } catch (err) {
      setError("Failed to read file");
    }
  };

  const handlePreview = async () => {
    if (!selectedProvider || !fileContent) return;

    setIsLoading(true);
    setError("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      const res = await fetch(`${baseUrl}/animals/${animalId}/genetics/import/preview`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          provider: selectedProvider.id,
          fileContent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Preview failed");
      }

      const result: PreviewResult = await res.json();
      setPreviewResult(result);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProvider || !fileContent) return;

    setStep("importing");
    setError("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      const res = await fetch(`${baseUrl}/animals/${animalId}/genetics/import`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          provider: selectedProvider.id,
          fileContent,
          mergeStrategy,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Import failed");
      }

      const result: ImportResult = await res.json();
      setImportResult(result);
      setStep("done");
      onImportComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const renderProviderSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-secondary">
        Select the genetic testing provider you used for <strong>{animalName}</strong>.
      </p>

      <div className="space-y-2">
        {availableProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => {
              if (provider.isSupported) {
                setSelectedProvider(provider);
                setStep("upload");
              }
            }}
            disabled={!provider.isSupported}
            className={`w-full p-4 rounded-lg border text-left transition-colors ${
              provider.isSupported
                ? "border-border hover:border-primary hover:bg-surface cursor-pointer"
                : "border-border-subtle bg-surface-alt cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{provider.name}</div>
                <div className="text-sm text-secondary">
                  {provider.isSupported
                    ? `Supports: ${provider.supportedFormats.join(", ")}`
                    : "Coming soon"}
                </div>
                {provider.id === "embark" && provider.isSupported && (
                  <div className="text-xs text-secondary mt-1">
                    Full import: health, traits, breed %, COI, MHC diversity, lineage, weight
                  </div>
                )}
              </div>
              {provider.isSupported && (
                <div className="text-primary">
                  <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {availableProviders.length === 0 && (
        <div className="text-center py-8 text-secondary">
          <p>No genetic testing providers available for {animalSpecies}.</p>
          <p className="text-sm mt-2">You can manually enter genetics data from the animal's profile.</p>
        </div>
      )}
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-4">
      <button
        onClick={() => {
          setSelectedProvider(null);
          setStep("select");
        }}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        <ChevronDown className="w-4 h-4 rotate-90" /> Back to provider selection
      </button>

      <div className="p-4 bg-surface-alt rounded-lg">
        <h4 className="font-medium mb-2">How to export from {selectedProvider?.name}</h4>
        <pre className="text-sm text-secondary whitespace-pre-wrap">
          {selectedProvider?.exportInstructions}
        </pre>
      </div>

      {selectedProvider?.id === "embark" && (
        <div className="p-4 border border-border rounded-lg space-y-3">
          <h4 className="font-medium text-sm">What gets imported</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Health test results (200+)</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Coat color genetics</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Coat type &amp; texture</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Physical traits</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Breed composition %</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Inbreeding coefficient (COI)</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>MHC immune diversity</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Lineage haplotypes</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Predicted adult weight</span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          fileContent ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-border hover:border-primary"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {fileContent ? (
          <div className="space-y-3">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
            <p className="font-semibold text-base text-green-900 dark:text-green-100 break-all">{fileName}</p>
            <p className="text-sm text-green-700 dark:text-green-300">File loaded successfully</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFileContent("");
                setFileName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="bg-white dark:bg-gray-800 border-green-600 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
            >
              Choose Different File
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-secondary" />
            <p className="font-medium">Drop your file here or click to browse</p>
            <p className="text-sm text-secondary">
              Supports: {selectedProvider?.supportedFormats.join(", ")}
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handlePreview} disabled={!fileContent || isLoading}>
          {isLoading ? "Processing..." : "Preview Import"}
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!previewResult) return null;

    const sections = [
      { key: "coatColor", label: "Coat Color", data: previewResult.preview.coatColor },
      { key: "health", label: "Health Markers", data: previewResult.preview.health },
      { key: "coatType", label: "Coat Type", data: previewResult.preview.coatType },
      { key: "physicalTraits", label: "Physical Traits", data: previewResult.preview.physicalTraits },
      { key: "eyeColor", label: "Eye Color", data: previewResult.preview.eyeColor },
      { key: "otherTraits", label: "Other Traits", data: previewResult.preview.otherTraits },
    ].filter((s) => s.data.length > 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">Preview: {previewResult.summary.total} markers found</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Review the data below before importing to {animalName}'s profile.
            </p>
          </div>
        </div>

        {/* Extended Data Section - Breed, COI, Weight, etc. */}
        {previewResult.extended && (
          <div className="grid grid-cols-2 gap-3">
            {/* Breed Composition */}
            {previewResult.extended.breedComposition && previewResult.extended.breedComposition.length > 0 && (
              <div className="col-span-2 p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Dna className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Breed Composition</span>
                </div>
                <div className="space-y-1.5">
                  {previewResult.extended.breedComposition.map((breed, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>{breed.breed}</span>
                          <span className="font-medium">{breed.percentage}%</span>
                        </div>
                        <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${breed.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COI */}
            {previewResult.extended.coi && (
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm">Inbreeding Coefficient</span>
                </div>
                <div className="text-2xl font-bold">
                  {previewResult.extended.coi.percentage.toFixed(2)}%
                </div>
                <div className={`text-xs font-medium mt-1 ${
                  previewResult.extended.coi.riskLevel === 'excellent' ? 'text-green-600' :
                  previewResult.extended.coi.riskLevel === 'good' ? 'text-green-500' :
                  previewResult.extended.coi.riskLevel === 'moderate' ? 'text-yellow-600' :
                  previewResult.extended.coi.riskLevel === 'high' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {previewResult.extended.coi.riskLevel.charAt(0).toUpperCase() + previewResult.extended.coi.riskLevel.slice(1)}
                </div>
              </div>
            )}

            {/* Predicted Weight */}
            {previewResult.extended.predictedAdultWeight && (
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-sm">Predicted Adult Weight</span>
                </div>
                <div className="text-2xl font-bold">
                  {previewResult.extended.predictedAdultWeight.value.toFixed(1)} {previewResult.extended.predictedAdultWeight.unit}
                </div>
              </div>
            )}

            {/* MHC Diversity */}
            {previewResult.extended.mhcDiversity && (
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-sm">Immune Diversity (MHC)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {previewResult.extended.mhcDiversity.drb1Alleles !== undefined && (
                    <div>
                      <span className="text-secondary">DRB1:</span>{" "}
                      <span className="font-medium">{previewResult.extended.mhcDiversity.drb1Alleles} alleles</span>
                    </div>
                  )}
                  {previewResult.extended.mhcDiversity.dqa1Dqb1Alleles !== undefined && (
                    <div>
                      <span className="text-secondary">DQA1/DQB1:</span>{" "}
                      <span className="font-medium">{previewResult.extended.mhcDiversity.dqa1Dqb1Alleles} alleles</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lineage */}
            {previewResult.extended.lineage && (previewResult.extended.lineage.mtHaplotype || previewResult.extended.lineage.yHaplotype) && (
              <div className="col-span-2 p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-sm">Lineage</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {previewResult.extended.lineage.mtHaplotype && (
                    <div>
                      <div className="text-secondary text-xs">Maternal (MT)</div>
                      <div className="font-mono">{previewResult.extended.lineage.mtHaplotype}</div>
                      {previewResult.extended.lineage.mtHaplogroup && (
                        <div className="text-xs text-secondary">Group: {previewResult.extended.lineage.mtHaplogroup}</div>
                      )}
                    </div>
                  )}
                  {previewResult.extended.lineage.yHaplotype && (
                    <div>
                      <div className="text-secondary text-xs">Paternal (Y)</div>
                      <div className="font-mono">{previewResult.extended.lineage.yHaplotype}</div>
                      {previewResult.extended.lineage.yHaplogroup && (
                        <div className="text-xs text-secondary">Group: {previewResult.extended.lineage.yHaplogroup}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {previewResult.warnings.length > 0 && (
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  {previewResult.warnings.length} warnings
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-200 mt-1 space-y-1">
                  {previewResult.warnings.slice(0, 5).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {previewResult.warnings.length > 5 && (
                    <li className="text-amber-700 dark:text-amber-300">...and {previewResult.warnings.length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.key} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full p-3 flex items-center justify-between bg-surface hover:bg-surface-alt transition-colors"
              >
                <span className="font-medium">
                  {section.label} ({section.data.length})
                </span>
                {expandedSections.has(section.key) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.has(section.key) && (
                <div className="p-3 bg-surface-alt border-t border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-secondary">
                        <th className="pb-2">Locus</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Genotype</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.data.map((locus, i) => (
                        <tr key={i} className="border-t border-border-subtle">
                          <td className="py-1.5 font-mono">{locus.locus}</td>
                          <td className="py-1.5">{locus.locusName}</td>
                          <td className="py-1.5 font-mono">{locus.genotype}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {previewResult.unmapped.length > 0 && (
          <div className="border border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("unmapped")}
              className="w-full p-3 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <span className="font-medium text-amber-700 dark:text-amber-300">
                New Fields for Admin Review ({previewResult.unmapped.length})
              </span>
              {expandedSections.has("unmapped") ? (
                <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </button>
            {expandedSections.has("unmapped") && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  These fields will be auto-imported but need official mappings added by an admin:
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-amber-700 dark:text-amber-300">
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.unmapped.slice(0, 20).map((item, i) => (
                      <tr key={i} className="border-t border-amber-200 dark:border-amber-800">
                        <td className="py-1.5 text-amber-900 dark:text-amber-100">{item.category}</td>
                        <td className="py-1.5 text-amber-900 dark:text-amber-100">{item.name}</td>
                        <td className="py-1.5 font-mono text-amber-800 dark:text-amber-200">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewResult.unmapped.length > 20 && (
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                    ...and {previewResult.unmapped.length - 20} more
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-surface-alt rounded-lg">
          <label className="text-sm font-medium">Import Strategy</label>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="mergeStrategy"
                value="replace"
                checked={mergeStrategy === "replace"}
                onChange={() => setMergeStrategy("replace")}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium">Replace existing data</span>
                <p className="text-sm text-secondary">
                  Overwrites all existing genetic data with the imported data.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="mergeStrategy"
                value="merge"
                checked={mergeStrategy === "merge"}
                onChange={() => setMergeStrategy("merge")}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium">Merge with existing data</span>
                <p className="text-sm text-secondary">
                  Keeps existing data and adds/updates with imported values.
                </p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStep("upload")}>
            Back
          </Button>
          <Button onClick={handleImport}>
            Import {previewResult.summary.total} Markers
          </Button>
        </div>
      </div>
    );
  };

  const renderImportingStep = () => (
    <div className="py-12 text-center">
      <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      <p className="mt-4 font-medium">Importing genetic data...</p>
      <p className="text-sm text-secondary">This may take a moment.</p>
    </div>
  );

  const renderDoneStep = () => {
    if (!importResult) return null;

    const totalImported = Object.values(importResult.imported).reduce((a, b) => a + b, 0);

    return (
      <div className="py-8 text-center space-y-4">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <div>
          <p className="text-xl font-medium">Import Complete!</p>
          <p className="text-secondary">
            Successfully imported {totalImported} genetic markers for {animalName}.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          {importResult.imported.coatColor > 0 && (
            <div className="p-3 bg-surface-alt rounded-lg">
              <div className="font-medium">{importResult.imported.coatColor}</div>
              <div className="text-secondary">Coat Color</div>
            </div>
          )}
          {importResult.imported.health > 0 && (
            <div className="p-3 bg-surface-alt rounded-lg">
              <div className="font-medium">{importResult.imported.health}</div>
              <div className="text-secondary">Health</div>
            </div>
          )}
          {importResult.imported.coatType > 0 && (
            <div className="p-3 bg-surface-alt rounded-lg">
              <div className="font-medium">{importResult.imported.coatType}</div>
              <div className="text-secondary">Coat Type</div>
            </div>
          )}
          {importResult.imported.physicalTraits > 0 && (
            <div className="p-3 bg-surface-alt rounded-lg">
              <div className="font-medium">{importResult.imported.physicalTraits}</div>
              <div className="text-secondary">Physical</div>
            </div>
          )}
          {importResult.imported.eyeColor > 0 && (
            <div className="p-3 bg-surface-alt rounded-lg">
              <div className="font-medium">{importResult.imported.eyeColor}</div>
              <div className="text-secondary">Eye Color</div>
            </div>
          )}
        </div>

        {importResult.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-left">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {importResult.warnings.length} fields could not be mapped
            </p>
          </div>
        )}

        {importResult.newMarkersPendingReview && importResult.newMarkersPendingReview > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-left">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {importResult.newMarkersPendingReview} new marker{importResult.newMarkersPendingReview !== 1 ? "s" : ""} flagged for admin review
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              These are markers we haven't seen before. An admin will categorize them and they'll be available in future imports.
            </p>
          </div>
        )}

        <Button onClick={onClose}>Done</Button>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        step === "done"
          ? "Import Complete"
          : step === "preview"
          ? "Review Import Data"
          : step === "upload"
          ? `Import from ${selectedProvider?.name}`
          : "Import Genetic Test Results"
      }
      size="lg"
    >
      {step === "select" && renderProviderSelection()}
      {step === "upload" && renderUploadStep()}
      {step === "preview" && renderPreviewStep()}
      {step === "importing" && renderImportingStep()}
      {step === "done" && renderDoneStep()}
    </Dialog>
  );
}
