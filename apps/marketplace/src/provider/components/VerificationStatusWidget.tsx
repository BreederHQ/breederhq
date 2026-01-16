// apps/marketplace/src/provider/components/VerificationStatusWidget.tsx
// Verification status and trust-building widget for service providers

import * as React from "react";
import { useState, useEffect } from "react";
import {
  get2FAStatus,
  getUserVerificationStatus,
  setupTOTP,
  verifyTOTP,
  startIdentityVerification,
  type TwoFactorStatus,
  type UserVerificationStatus,
  type ServiceProviderVerificationTier,
} from "../../api/client";
import { Shield, CheckCircle2, AlertCircle, Lock, Star, Award, Clock } from "lucide-react";

interface VerificationStatusWidgetProps {
  compact?: boolean;
}

const TIER_LABELS: Record<ServiceProviderVerificationTier, string> = {
  LISTED: "Listed",
  IDENTITY_VERIFIED: "Identity Verified",
  VERIFIED_PROFESSIONAL: "Verified Professional",
  ACCREDITED_PROVIDER: "Accredited Provider",
};

const TIER_COLORS: Record<ServiceProviderVerificationTier, string> = {
  LISTED: "bg-gray-100 text-gray-700",
  IDENTITY_VERIFIED: "bg-blue-100 text-blue-800",
  VERIFIED_PROFESSIONAL: "bg-green-100 text-green-800",
  ACCREDITED_PROVIDER: "bg-purple-100 text-purple-800",
};

export function VerificationStatusWidget({ compact = false }: VerificationStatusWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<UserVerificationStatus | null>(null);

  // Modal states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  // Load verification and 2FA status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const [twoFA, verification] = await Promise.all([
        get2FAStatus(),
        getUserVerificationStatus(),
      ]);
      setTwoFAStatus(twoFA);
      setVerificationStatus(verification);
    } catch (err) {
      console.error("Failed to load verification status:", err);
      setError(err instanceof Error ? err.message : "Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Shield className="w-5 h-5 animate-pulse" />
          <span>Loading verification status...</span>
        </div>
      </div>
    );
  }

  if (error || !verificationStatus || !twoFAStatus) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span>Unable to load verification status</span>
        </div>
      </div>
    );
  }

  const currentTier = verificationStatus.tier;
  const nextSteps = getNextSteps(twoFAStatus, verificationStatus);

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Trust Level:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[currentTier]}`}>
              {TIER_LABELS[currentTier]}
            </span>
          </div>
          {nextSteps.length > 0 && (
            <button
              onClick={() => handleNextStepClick(nextSteps[0])}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Upgrade →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Trust & Verification</h3>
            </div>
            <p className="text-sm text-gray-600">
              Build trust with buyers by verifying your identity and credentials
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${TIER_COLORS[currentTier]}`}>
            {TIER_LABELS[currentTier]}
          </span>
        </div>

        {/* Current Status */}
        <div className="space-y-3 mb-6">
          <StatusItem
            icon={Lock}
            label="Two-Factor Authentication"
            completed={twoFAStatus.enabled}
            description={twoFAStatus.enabled ? `Enabled via ${twoFAStatus.method}` : "Not enabled"}
          />
          <StatusItem
            icon={CheckCircle2}
            label="Identity Verification"
            completed={verificationStatus.identityVerified}
            description={verificationStatus.identityVerified ? "Verified via Stripe Identity" : "Not verified"}
          />
          <StatusItem
            icon={Star}
            label="Verified Professional"
            completed={verificationStatus.verifiedPackage.active}
            description={verificationStatus.verifiedPackage.active ? "Active" : "Not purchased"}
          />
          <StatusItem
            icon={Award}
            label="Accredited Provider"
            completed={verificationStatus.accreditedPackage.active}
            description={verificationStatus.accreditedPackage.active ? "Active" : "Not purchased"}
          />
        </div>

        {/* Badges */}
        {Object.values(verificationStatus.badges).some(Boolean) && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Active Badges:</p>
            <div className="flex flex-wrap gap-2">
              {verificationStatus.badges.quickResponder && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ⚡ Quick Responder
                </span>
              )}
              {verificationStatus.badges.established && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🏛️ Established
                </span>
              )}
              {verificationStatus.badges.topRated && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⭐ Top Rated
                </span>
              )}
              {verificationStatus.badges.trusted && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  ✓ Trusted
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pending Request */}
        {verificationStatus.pendingRequest && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {verificationStatus.pendingRequest.packageType === "VERIFIED" ? "Verified Professional" : "Accredited Provider"} - {verificationStatus.pendingRequest.status.replace("_", " ")}
                </p>
                <p className="text-xs text-gray-600">
                  Submitted {new Date(verificationStatus.pendingRequest.createdAt).toLocaleDateString()}
                </p>
                {verificationStatus.pendingRequest.infoRequestNote && (
                  <div className="mt-2 p-2 bg-white rounded border border-amber-300">
                    <p className="text-xs font-medium text-gray-700">Admin Note:</p>
                    <p className="text-xs text-gray-600 mt-1">{verificationStatus.pendingRequest.infoRequestNote}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {nextSteps.length === 1 ? "Next Step:" : "Available Upgrades:"}
            </p>
            <div className="space-y-2">
              {nextSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNextStepClick(step)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.color}`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {step.price && (
                    <span className="text-sm font-semibold text-gray-900">{step.price}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Impact Message */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <p className="text-sm text-gray-700">
            <strong>Did you know?</strong> Verified providers receive 4x more inquiries than unverified listings.
          </p>
        </div>
      </div>

      {/* Modals */}
      {show2FAModal && (
        <TwoFactorSetupModal
          onClose={() => {
            setShow2FAModal(false);
            loadStatus();
          }}
        />
      )}
      {showIdentityModal && (
        <IdentityVerificationModal
          onClose={() => {
            setShowIdentityModal(false);
            loadStatus();
          }}
        />
      )}
    </>
  );

  function handleNextStepClick(step: NextStep) {
    if (step.action === "setup2fa") {
      setShow2FAModal(true);
    } else if (step.action === "verifyIdentity") {
      setShowIdentityModal(true);
    } else if (step.action === "purchasePackage") {
      setShowPackageModal(true);
    }
  }
}

// Helper Components

function StatusItem({
  icon: Icon,
  label,
  completed,
  description,
}: {
  icon: React.ElementType;
  label: string;
  completed: boolean;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completed ? "bg-green-100" : "bg-gray-100"}`}>
        <Icon className={`w-4 h-4 ${completed ? "text-green-600" : "text-gray-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${completed ? "text-gray-900" : "text-gray-600"}`}>
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {completed && (
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      )}
    </div>
  );
}

// Helper Functions

interface NextStep {
  title: string;
  description: string;
  action: "setup2fa" | "verifyIdentity" | "purchasePackage";
  icon: React.ElementType;
  color: string;
  price?: string;
  packageType?: "VERIFIED" | "ACCREDITED";
}

function getNextSteps(twoFA: TwoFactorStatus, verification: UserVerificationStatus): NextStep[] {
  const steps: NextStep[] = [];

  // Step 1: Enable 2FA (required for everything)
  if (!twoFA.enabled) {
    steps.push({
      title: "Enable Two-Factor Authentication",
      description: "Secure your account and unlock verification options",
      action: "setup2fa",
      icon: Lock,
      color: "bg-blue-100 text-blue-600",
    });
    return steps; // Must complete 2FA first
  }

  // Step 2: Identity Verification (requires 2FA)
  if (!verification.identityVerified) {
    steps.push({
      title: "Verify Your Identity",
      description: "Quick verification via Stripe Identity (2-3 minutes)",
      action: "verifyIdentity",
      icon: CheckCircle2,
      color: "bg-blue-100 text-blue-600",
    });
  }

  // Step 3: Verified Professional Package
  if (!verification.verifiedPackage.active && !verification.pendingRequest) {
    steps.push({
      title: "Become a Verified Professional",
      description: "Manual review + verification badge",
      action: "purchasePackage",
      icon: Star,
      color: "bg-green-100 text-green-600",
      price: "$99",
      packageType: "VERIFIED",
    });
  }

  // Step 4: Accredited Provider Package
  if (
    (verification.verifiedPackage.active || verification.identityVerified) &&
    !verification.accreditedPackage.active &&
    !verification.pendingRequest
  ) {
    steps.push({
      title: "Become an Accredited Provider",
      description: "Premium verification with enhanced visibility",
      action: "purchasePackage",
      icon: Award,
      color: "bg-purple-100 text-purple-600",
      price: "$199",
      packageType: "ACCREDITED",
    });
  }

  return steps;
}

// Modal Components

function TwoFactorSetupModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await setupTOTP();
      setQrCodeUrl(response.otpauthUrl);
      setSecret(response.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      await verifyTOTP(code);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Enable Two-Factor Authentication
        </h2>

        {!qrCodeUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Two-factor authentication adds an extra layer of security to your account and is required for identity verification.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSetup}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Setup with Authenticator App"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
              </p>
              <div className="bg-white p-3 rounded border border-gray-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                  alt="QR Code"
                  className="w-full max-w-[200px] mx-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Or enter this secret manually: <code className="bg-gray-100 px-1 rounded">{secret}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter 6-digit code from your app:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-wider"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={code.length !== 6 || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityVerificationModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [verificationStarted, setVerificationStarted] = useState(false);

  // Load Stripe Identity SDK
  useEffect(() => {
    if (clientSecret && !verificationStarted) {
      loadStripeIdentity();
    }
  }, [clientSecret, verificationStarted]);

  const loadStripeIdentity = async () => {
    try {
      // Dynamically load Stripe Identity SDK
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.onload = () => {
        initializeStripeIdentity();
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error("Failed to load Stripe Identity SDK:", err);
      setError("Failed to load verification SDK");
    }
  };

  const initializeStripeIdentity = async () => {
    try {
      // @ts-ignore - Stripe loaded dynamically
      const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

      if (!clientSecret) return;

      setVerificationStarted(true);

      // Initialize Stripe Identity verification
      // @ts-ignore
      const { error: verifyError } = await stripe.verifyIdentity(clientSecret);

      if (verifyError) {
        setError(verifyError.message || "Verification failed");
        setVerificationStarted(false);
        setClientSecret(null);
      } else {
        // Verification completed successfully
        onClose();
      }
    } catch (err) {
      console.error("Stripe Identity error:", err);
      setError(err instanceof Error ? err.message : "Verification failed");
      setVerificationStarted(false);
      setClientSecret(null);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await startIdentityVerification();
      setClientSecret(response.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start identity verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Identity Verification
        </h2>

        {verificationStarted ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-600 text-center">
                Loading Stripe Identity verification...
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                Follow the prompts to complete your identity verification
              </p>
            </div>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
                <button
                  onClick={() => {
                    setVerificationStarted(false);
                    setClientSecret(null);
                    setError(null);
                  }}
                  className="block mt-2 text-xs underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Verify your identity using Stripe Identity. This process typically takes 2-3 minutes and requires a government-issued ID.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">What you'll need:</p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4">
                <li>• Government-issued photo ID (driver's license, passport, etc.)</li>
                <li>• A device with a camera (phone or computer)</li>
                <li>• 2-3 minutes of your time</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-700">
                <strong>Privacy & Security:</strong> Your verification is processed securely by Stripe. We do not store your ID documents.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleStart}
                disabled={loading || clientSecret !== null}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Starting..." : "Start Verification"}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationStatusWidget;
