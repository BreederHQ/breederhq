// apps/portal/src/pages/PortalContractSigningPage.tsx
// Contract signing page for buyers in the portal

import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { Button } from "../design/Button";
import { InlineNotice } from "../design/InlineNotice";
import { SignatureCapture, type SignatureCaptureData } from "../components/signing";
import { FileText, AlertTriangle, CheckCircle, XCircle, Clock, Download } from "lucide-react";

interface ContractParty {
  id: number;
  role: string;
  name: string;
  email: string;
  signer: boolean;
  status: "pending" | "viewed" | "signed" | "declined";
  signedAt?: string;
}

interface Contract {
  id: number;
  title: string;
  status: string;
  expiresAt?: string;
  parties: ContractParty[];
  signatureOptions: {
    allowTyped: boolean;
    allowDrawn: boolean;
    allowUploaded: boolean;
  };
}

interface Props {
  contractId: number;
}

// API helper
async function fetchWithAuth(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function PortalContractSigningPage({ contractId }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [documentHtml, setDocumentHtml] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const [signatureData, setSignatureData] = React.useState<SignatureCaptureData | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [showDeclineModal, setShowDeclineModal] = React.useState(false);
  const [declineReason, setDeclineReason] = React.useState("");
  const [declining, setDeclining] = React.useState(false);

  // Find current user's party
  const myParty = React.useMemo(() => {
    if (!contract) return null;
    // In a real app, we'd match by email from session
    // For now, find the first pending signer (buyer typically)
    return contract.parties.find(
      (p) => p.signer && p.role === "BUYER" && ["pending", "viewed"].includes(p.status)
    );
  }, [contract]);

  // Fetch contract data
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [contractRes, documentRes] = await Promise.all([
          fetchWithAuth(`/api/v1/portal/contracts/${contractId}/signing`),
          fetchWithAuth(`/api/v1/portal/contracts/${contractId}/document`),
        ]);

        if (!cancelled) {
          setContract(contractRes);
          setDocumentHtml(documentRes.html || "");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contractId]);

  // Handle signature submission
  const handleSign = async () => {
    if (!signatureData || !signatureData.consent) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await fetchWithAuth(`/api/v1/portal/contracts/${contractId}/sign`, {
        method: "POST",
        body: JSON.stringify({
          signatureType: signatureData.type,
          signatureData: {
            typedName: signatureData.typedName,
            drawnImageBase64: signatureData.drawnImageBase64,
          },
          consent: signatureData.consent,
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle decline
  const handleDecline = async () => {
    setDeclining(true);
    try {
      await fetchWithAuth(`/api/v1/portal/contracts/${contractId}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason: declineReason }),
      });
      // Reload the page to show declined status
      window.location.reload();
    } catch (err: any) {
      alert(`Failed to decline: ${err.message}`);
    } finally {
      setDeclining(false);
      setShowDeclineModal(false);
    }
  };

  // Check if signature is valid
  const isSignatureValid = React.useMemo(() => {
    if (!signatureData?.consent) return false;
    if (signatureData.type === "typed" && !signatureData.typedName?.trim()) return false;
    if (signatureData.type === "drawn" && !signatureData.drawnImageBase64) return false;
    return true;
  }, [signatureData]);

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-accent)]" />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !contract) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <InlineNotice type="error" title="Unable to load contract">
            {error || "Contract not found"}
          </InlineNotice>
        </div>
      </PageContainer>
    );
  }

  // Success state
  if (success) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Contract Signed Successfully!
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Thank you for signing. You will receive a copy of the signed document via email.
          </p>
          <Button onClick={() => window.location.href = "/agreements"}>
            Return to Agreements
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Already signed/declined/expired states
  if (contract.status === "signed") {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Contract Already Signed
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            This contract has been fully executed by all parties.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (contract.status === "declined") {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Contract Declined
          </h1>
          <p className="text-[var(--text-secondary)]">
            This contract has been declined by one of the parties.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (contract.status === "expired") {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Contract Expired
          </h1>
          <p className="text-[var(--text-secondary)]">
            This contract has expired and can no longer be signed.
          </p>
        </div>
      </PageContainer>
    );
  }

  // No party to sign
  if (!myParty) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <InlineNotice type="warning" title="Already Signed">
            You have already signed this contract or are not a signer.
          </InlineNotice>
        </div>
      </PageContainer>
    );
  }

  // Main signing view
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-[var(--brand-accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{contract.title}</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Please review the document below and sign to complete the agreement.
          </p>
          {contract.expiresAt && (
            <p className="text-sm text-amber-600 mt-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Expires: {new Date(contract.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Parties Summary */}
        <div className="mb-6 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">Contract Parties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contract.parties.map((party) => (
              <div key={party.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{party.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{party.role}</p>
                </div>
                {party.signer && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      party.status === "signed"
                        ? "bg-green-100 text-green-700"
                        : party.status === "declined"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {party.status === "signed"
                      ? "Signed"
                      : party.status === "declined"
                      ? "Declined"
                      : "Pending"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Document Viewer */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Document</h2>
          <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 max-h-[500px] overflow-y-auto shadow-inner">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: documentHtml }}
            />
          </div>
        </div>

        {/* Signature Section */}
        <div className="mb-8 p-6 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Signature</h2>

          <SignatureCapture
            allowTyped={contract.signatureOptions.allowTyped}
            allowDrawn={contract.signatureOptions.allowDrawn}
            onCapture={setSignatureData}
            disabled={submitting}
            initialName={myParty.name}
          />
        </div>

        {/* Error message */}
        {submitError && (
          <div className="mb-4">
            <InlineNotice type="error" title="Signature Failed">
              {submitError}
            </InlineNotice>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="ghost" onClick={() => setShowDeclineModal(true)} disabled={submitting}>
            <XCircle className="w-4 h-4 mr-2" />
            Decline to Sign
          </Button>
          <Button onClick={handleSign} disabled={!isSignatureValid || submitting}>
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Sign Contract
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Decline Contract?</h2>
            </div>

            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Are you sure you want to decline this contract? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Reason (optional)
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                rows={3}
                placeholder="Enter your reason for declining..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeclineModal(false)}
                disabled={declining}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDecline}
                disabled={declining}
              >
                {declining ? "Declining..." : "Decline Contract"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
