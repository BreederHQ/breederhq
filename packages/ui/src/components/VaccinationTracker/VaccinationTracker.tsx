// packages/ui/src/components/VaccinationTracker/VaccinationTracker.tsx
import * as React from "react";
import { Plus, Syringe, FileText, Pencil, Trash2, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { Button } from "../Button/Button";
import { VaccinationStatusBadge, VaccinationStatusIcon } from "./VaccinationStatusBadge";
import { AddVaccinationDialog } from "./AddVaccinationDialog";
import {
  calculateVaccinationStatus,
  formatAdministeredDate,
  formatExpirationDate,
  sortByUrgency,
} from "../../utils/vaccinationStatus";
import type {
  VaccinationProtocol,
  VaccinationRecord,
  VaccinationStatus,
  CreateVaccinationInput,
} from "@bhq/api";

export interface VaccinationAlertState {
  expiredCount: number;
  dueSoonCount: number;
  hasIssues: boolean;
}

export interface VaccinationTrackerProps {
  /** Animal ID */
  animalId: number;
  /** Animal name for display */
  animalName: string;
  /** Species for protocol filtering */
  species: string;
  /** Available vaccination protocols for this species */
  protocols: VaccinationProtocol[];
  /** Existing vaccination records */
  records: VaccinationRecord[];
  /** Whether in edit mode */
  editMode?: boolean;
  /** Called when a record is created */
  onCreate?: (input: CreateVaccinationInput) => Promise<void>;
  /** Called when a record is updated */
  onUpdate?: (recordId: number, input: Partial<CreateVaccinationInput>) => Promise<void>;
  /** Called when a record is deleted */
  onDelete?: (recordId: number) => Promise<void>;
  /** Called when document upload is requested */
  onUploadDocument?: (recordId: number) => void;
  /** Loading state */
  loading?: boolean;
  /** Called when alert state changes (for parent components to show indicators) */
  onAlertStateChange?: (state: VaccinationAlertState) => void;
}

interface VaccinationRowData {
  protocol: VaccinationProtocol;
  record: VaccinationRecord | null;
  status: VaccinationStatus;
  statusText: string;
  daysRemaining: number;
  expiresAt: string;
}

export function VaccinationTracker({
  animalId,
  animalName,
  species,
  protocols,
  records,
  editMode = false,
  onCreate,
  onUpdate,
  onDelete,
  onUploadDocument,
  loading = false,
  onAlertStateChange,
}: VaccinationTrackerProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedProtocol, setSelectedProtocol] = React.useState<VaccinationProtocol | null>(null);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Build combined list of protocols with their records
  const vaccinationRows: VaccinationRowData[] = React.useMemo(() => {
    const rows: VaccinationRowData[] = [];

    for (const protocol of protocols) {
      // Find the most recent record for this protocol
      const protocolRecords = records
        .filter((r) => r.protocolKey === protocol.key)
        .sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime());

      const latestRecord = protocolRecords[0] || null;

      if (latestRecord) {
        const statusResult = calculateVaccinationStatus(
          latestRecord.administeredAt,
          protocol.intervalMonths,
          latestRecord.expiresAt
        );
        rows.push({
          protocol,
          record: latestRecord,
          status: statusResult.status,
          statusText: statusResult.statusText,
          daysRemaining: statusResult.daysRemaining,
          expiresAt: statusResult.expiresAt,
        });
      } else {
        rows.push({
          protocol,
          record: null,
          status: "not_recorded",
          statusText: "Not recorded",
          daysRemaining: 0,
          expiresAt: "",
        });
      }
    }

    // Sort by urgency (expired/due_soon first, then core before non-core)
    return sortByUrgency(rows).sort((a, b) => {
      // Within same status priority, put core vaccines first
      if (a.status === b.status) {
        if (a.protocol.isCore && !b.protocol.isCore) return -1;
        if (!a.protocol.isCore && b.protocol.isCore) return 1;
      }
      return 0;
    });
  }, [protocols, records]);

  const toggleExpanded = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAddClick = (protocol?: VaccinationProtocol) => {
    setSelectedProtocol(protocol || null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProtocol(null);
  };

  const handleSave = async (input: CreateVaccinationInput) => {
    if (onCreate) {
      await onCreate(input);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!onDelete) return;
    if (window.confirm("Are you sure you want to delete this vaccination record?")) {
      await onDelete(recordId);
    }
  };

  // Summary counts
  const summary = React.useMemo(() => {
    const current = vaccinationRows.filter((r) => r.status === "current").length;
    const dueSoon = vaccinationRows.filter((r) => r.status === "due_soon").length;
    const expired = vaccinationRows.filter((r) => r.status === "expired").length;
    const notRecorded = vaccinationRows.filter((r) => r.status === "not_recorded").length;
    return { current, dueSoon, expired, notRecorded };
  }, [vaccinationRows]);

  // Notify parent of alert state changes
  React.useEffect(() => {
    if (onAlertStateChange && !loading) {
      onAlertStateChange({
        expiredCount: summary.expired,
        dueSoonCount: summary.dueSoon,
        hasIssues: summary.expired > 0 || summary.dueSoon > 0,
      });
    }
  }, [summary.expired, summary.dueSoon, loading, onAlertStateChange]);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface p-4 border border-hairline">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-surface p-4 border border-hairline">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-brand" />
            <h3 className="font-semibold text-sm">Vaccinations</h3>
            {/* Summary pills */}
            <div className="flex items-center gap-1.5 ml-2">
              {summary.expired > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  {summary.expired} expired
                </span>
              )}
              {summary.dueSoon > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  {summary.dueSoon} due soon
                </span>
              )}
              {summary.notRecorded > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                  {summary.notRecorded} not recorded
                </span>
              )}
            </div>
          </div>
          {editMode && (
            <Button size="sm" variant="outline" onClick={() => handleAddClick()}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Vaccination List */}
        <div className="space-y-1">
          {vaccinationRows.map((row) => {
            const isExpanded = expandedRows.has(row.protocol.key);
            const hasRecord = row.record !== null;

            return (
              <div
                key={row.protocol.key}
                className={`rounded-lg border transition-colors ${
                  row.status === "expired"
                    ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20"
                    : row.status === "due_soon"
                    ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-hairline"
                }`}
              >
                {/* Main Row */}
                <div
                  className={`flex items-center gap-3 p-3 ${hasRecord ? "cursor-pointer" : ""}`}
                  onClick={() => hasRecord && toggleExpanded(row.protocol.key)}
                >
                  {/* Expand/Collapse or Status Icon */}
                  <div className="w-5 flex justify-center">
                    {hasRecord ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-secondary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-secondary" />
                      )
                    ) : (
                      <VaccinationStatusIcon status={row.status} size="sm" />
                    )}
                  </div>

                  {/* Status Icon (when has record) */}
                  {hasRecord && <VaccinationStatusIcon status={row.status} size="sm" />}

                  {/* Vaccine Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{row.protocol.name}</span>
                      {row.protocol.isCore && (
                        <span className="text-[10px] px-1 py-0.5 bg-brand/10 text-brand rounded flex-shrink-0">
                          Core
                        </span>
                      )}
                    </div>
                    {!hasRecord && (
                      <p className="text-xs text-secondary truncate">{row.protocol.description}</p>
                    )}
                  </div>

                  {/* Status / Date Info */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hasRecord ? (
                      <>
                        <div className="text-right text-xs">
                          <div className="text-secondary">
                            Last: {formatAdministeredDate(row.record!.administeredAt)}
                          </div>
                          <div className={row.status === "expired" ? "text-red-600 dark:text-red-400" : "text-secondary"}>
                            {row.status === "expired" ? "Expired" : "Expires"}: {formatExpirationDate(row.expiresAt)}
                          </div>
                        </div>
                        <VaccinationStatusBadge status={row.status} statusText={row.statusText} />
                      </>
                    ) : editMode ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddClick(row.protocol);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add first record
                      </Button>
                    ) : (
                      <span className="text-xs text-secondary">Not recorded</span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasRecord && (
                  <div className="px-3 pb-3 pt-1 border-t border-hairline/50 ml-8 space-y-2">
                    {/* Provider Info */}
                    {(row.record!.veterinarian || row.record!.clinic) && (
                      <div className="flex gap-4 text-xs text-secondary">
                        {row.record!.veterinarian && <span>Vet: {row.record!.veterinarian}</span>}
                        {row.record!.clinic && <span>Clinic: {row.record!.clinic}</span>}
                      </div>
                    )}

                    {/* Batch/Lot */}
                    {row.record!.batchLotNumber && (
                      <div className="text-xs text-secondary">
                        Lot #: <span className="font-mono">{row.record!.batchLotNumber}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {row.record!.notes && (
                      <div className="text-xs text-secondary bg-surface-alt p-2 rounded">
                        {row.record!.notes}
                      </div>
                    )}

                    {/* Document */}
                    {row.record!.documentId ? (
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="w-3.5 h-3.5 text-brand" />
                        <span className="text-brand">Document attached</span>
                      </div>
                    ) : editMode && onUploadDocument ? (
                      <button
                        onClick={() => onUploadDocument(row.record!.id)}
                        className="flex items-center gap-1.5 text-xs text-secondary hover:text-brand transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Attach document
                      </button>
                    ) : null}

                    {/* Edit/Delete Actions */}
                    {editMode && (
                      <div className="flex items-center gap-2 pt-2 border-t border-hairline/50">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddClick(row.protocol)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add new record
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDelete(row.record!.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {vaccinationRows.length === 0 && (
          <div className="text-center py-8 text-secondary">
            <Syringe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No vaccination protocols available for this species.</p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <AddVaccinationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        animalName={animalName}
        protocols={protocols}
        selectedProtocol={selectedProtocol}
        onSave={handleSave}
      />
    </>
  );
}
