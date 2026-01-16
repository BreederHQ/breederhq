// apps/marketplace/src/admin/pages/ModerationQueuePage.tsx
// Admin moderation queue for reviewing reported service listings

import * as React from "react";
import { useState, useEffect } from "react";
import { Flag, Eye, CheckCircle, XCircle, AlertTriangle, Clock, Search, Filter } from "lucide-react";
import { getListingReports, updateReportStatus, type ListingReport } from "../../api/client";

type ReportReason = "FRAUD" | "SPAM" | "INAPPROPRIATE" | "MISLEADING" | "PROHIBITED" | "COPYRIGHT" | "OTHER";
type ReportStatus = "PENDING" | "REVIEWED" | "ACTIONED" | "DISMISSED";

const REASON_LABELS: Record<ReportReason, string> = {
  FRAUD: "Fraudulent or scam listing",
  SPAM: "Spam or duplicate content",
  INAPPROPRIATE: "Inappropriate content",
  MISLEADING: "Misleading information",
  PROHIBITED: "Prohibited service",
  COPYRIGHT: "Copyright infringement",
  OTHER: "Other issue",
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  REVIEWED: "bg-blue-100 text-blue-800",
  ACTIONED: "bg-green-100 text-green-800",
  DISMISSED: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<ReportStatus, React.ElementType> = {
  PENDING: Clock,
  REVIEWED: Eye,
  ACTIONED: CheckCircle,
  DISMISSED: XCircle,
};

export function ModerationQueuePage() {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [offset, setOffset] = useState(0);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

  // Modal states
  const [selectedReport, setSelectedReport] = useState<ListingReport | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, [statusFilter, offset]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterStatus = statusFilter !== "ALL" ? statusFilter : undefined;
      const data = await getListingReports(filterStatus, limit, offset);

      setReports(data.reports);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = (report: ListingReport) => {
    setSelectedReport(report);
    setShowReviewModal(true);
  };

  const handleUpdateReportStatus = async (reportId: number, newStatus: ReportStatus, notes: string) => {
    try {
      await updateReportStatus(reportId, newStatus, notes);

      // Refresh list
      await loadReports();
      setShowReviewModal(false);
      setSelectedReport(null);
    } catch (err) {
      console.error("Failed to update report:", err);
      alert("Failed to update report status");
    }
  };

  const filteredReports = reports.filter((report) => {
    if (statusFilter !== "ALL" && report.status !== statusFilter) return false;
    if (searchQuery && !report.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Moderation Queue</h1>
          <p className="text-sm text-gray-600">
            Review and manage reported service listings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Pending Review"
            value={reports.filter(r => r.status === "PENDING").length}
            color="text-amber-600"
            icon={Clock}
          />
          <StatCard
            label="Reviewed"
            value={reports.filter(r => r.status === "REVIEWED").length}
            color="text-blue-600"
            icon={Eye}
          />
          <StatCard
            label="Actioned"
            value={reports.filter(r => r.status === "ACTIONED").length}
            color="text-green-600"
            icon={CheckCircle}
          />
          <StatCard
            label="Dismissed"
            value={reports.filter(r => r.status === "DISMISSED").length}
            color="text-gray-600"
            icon={XCircle}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "ALL")}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ACTIONED">Actioned</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by listing title..."
                className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadReports}
              disabled={loading}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Reports List */}
        {error ? (
          <div className="bg-white rounded-lg border border-red-200 p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No reports found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">#{report.id}</div>
                      <div className="text-xs text-gray-500">{report.reporterEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{report.listingTitle}</div>
                      <div className="text-xs text-gray-500">ID: {report.listingId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{REASON_LABELS[report.reason]}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                        {React.createElement(STATUS_ICONS[report.status], { className: "w-3 h-3" })}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => handleReviewReport(report)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} reports
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <ReviewReportModal
          report={selectedReport}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReport(null);
          }}
          onSubmit={handleUpdateReportStatus}
        />
      )}
    </div>
  );
}

// Helper Components

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-20`} />
      </div>
    </div>
  );
}

function ReviewReportModal({
  report,
  onClose,
  onSubmit,
}: {
  report: ListingReport;
  onClose: () => void;
  onSubmit: (reportId: number, status: ReportStatus, notes: string) => Promise<void>;
}) {
  const [newStatus, setNewStatus] = useState<ReportStatus>(report.status);
  const [reviewNotes, setReviewNotes] = useState(report.reviewNotes || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reviewNotes.trim() && newStatus !== "DISMISSED") {
      alert("Please provide review notes");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(report.id, newStatus, reviewNotes.trim());
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Review Report #{report.id}</h2>
            <p className="text-sm text-gray-600 mt-1">{report.listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Report Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
            <p className="text-sm text-gray-900">{REASON_LABELS[report.reason]}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reporter Description</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
              {report.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reported By</label>
              <p className="text-sm text-gray-900">{report.reporterEmail}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Submitted</label>
              <p className="text-sm text-gray-900">{new Date(report.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {report.reviewedAt && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-medium text-gray-700 mb-1">Previous Review</p>
              <p className="text-xs text-gray-600">
                Reviewed by {report.reviewedBy} on {new Date(report.reviewedAt).toLocaleString()}
              </p>
              {report.reviewNotes && (
                <p className="text-sm text-gray-900 mt-2">{report.reviewNotes}</p>
              )}
            </div>
          )}
        </div>

        {/* Action Form */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["REVIEWED", "ACTIONED", "DISMISSED"] as ReportStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setNewStatus(status)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    newStatus === status
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Notes *
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Explain your decision and any actions taken..."
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-gray-700">
              <strong>Action Guide:</strong>
            </p>
            <ul className="text-xs text-gray-600 mt-1 space-y-0.5 ml-4">
              <li>• <strong>REVIEWED:</strong> Investigated but no action needed yet</li>
              <li>• <strong>ACTIONED:</strong> Listing removed, edited, or provider warned</li>
              <li>• <strong>DISMISSED:</strong> Report invalid or not actionable</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !reviewNotes.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModerationQueuePage;
