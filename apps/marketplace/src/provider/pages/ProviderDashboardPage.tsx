// apps/marketplace/src/provider/pages/ProviderDashboardPage.tsx
// Service Provider Dashboard - Main portal page for service providers

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getServiceProviderProfile,
  getServiceProviderDashboard,
  getServiceProviderListings,
  createServiceProviderProfile,
  createServiceProviderListing,
  updateServiceProviderListing,
  publishServiceProviderListing,
  unpublishServiceProviderListing,
  deleteServiceProviderListing,
  createProviderCheckout,
  createProviderBillingPortal,
  type ServiceProviderProfile,
  type ProviderDashboard,
  type ProviderListingItem,
  type ProviderListingCreateInput,
  type ServiceProviderProfileInput,
  type ProviderServiceType,
} from "../../api/client";

// ============================================================================
// Types
// ============================================================================

type ViewMode = "dashboard" | "listings" | "settings";

const SERVICE_TYPE_LABELS: Record<ProviderServiceType, string> = {
  TRAINING: "Training",
  VETERINARY: "Veterinary",
  PHOTOGRAPHY: "Photography",
  GROOMING: "Grooming",
  TRANSPORT: "Transport",
  BOARDING: "Boarding",
  PRODUCT: "Product",
  OTHER_SERVICE: "Other Service",
};

// Free during early access - no listing limits
// const PLAN_LIMITS: Record<string, number> = {
//   FREE: 1,
//   PREMIUM: 5,
//   BUSINESS: 20,
// };

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    DRAFT: "bg-gray-100 text-gray-600",
    PAUSED: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-700",
    PREMIUM: "bg-blue-100 text-blue-800",
    BUSINESS: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[plan] || "bg-gray-100 text-gray-600"}`}
    >
      {plan}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProviderDashboardPage() {
  const [view, setView] = useState<ViewMode>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null);
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null);
  const [listings, setListings] = useState<ProviderListingItem[]>([]);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<ServiceProviderProfileInput>({
    businessName: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    country: "US",
  });

  // Modal states
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState<ProviderListingItem | null>(null);
  const [listingFormData, setListingFormData] = useState<ProviderListingCreateInput>({
    listingType: "TRAINING",
    title: "",
    description: "",
    city: "",
    state: "",
    priceCents: undefined,
    priceType: "contact",
  });

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileData = await getServiceProviderProfile();
      if (!profileData) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setShowOnboarding(false);

      const [dashboardData, listingsData] = await Promise.all([
        getServiceProviderDashboard(),
        getServiceProviderListings(),
      ]);

      setDashboard(dashboardData);
      setListings(listingsData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle onboarding
  const handleCreateProfile = async () => {
    try {
      setActionLoading(-1);
      const newProfile = await createServiceProviderProfile(onboardingData);
      setProfile(newProfile);
      setShowOnboarding(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle listing actions
  const handleOpenListingModal = (listing?: ProviderListingItem) => {
    if (listing) {
      setEditingListing(listing);
      setListingFormData({
        listingType: listing.listingType,
        title: listing.title,
        description: listing.description || "",
        customServiceType: listing.customServiceType || "",
        city: listing.city || "",
        state: listing.state || "",
        priceCents: listing.priceCents || undefined,
        priceType: listing.priceType || "contact",
      });
    } else {
      setEditingListing(null);
      setListingFormData({
        listingType: "TRAINING",
        title: "",
        description: "",
        customServiceType: "",
        city: profile?.city || "",
        state: profile?.state || "",
        priceCents: undefined,
        priceType: "contact",
      });
    }
    setShowListingModal(true);
  };

  const handleSaveListing = async () => {
    try {
      setActionLoading(-1);
      if (editingListing) {
        await updateServiceProviderListing(editingListing.id, listingFormData);
      } else {
        await createServiceProviderListing(listingFormData);
      }
      setShowListingModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      setActionLoading(id);
      await publishServiceProviderListing(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      setActionLoading(id);
      await unpublishServiceProviderListing(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setActionLoading(id);
      await deleteServiceProviderListing(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle billing
  const handleUpgrade = async (plan: "PREMIUM" | "BUSINESS") => {
    try {
      setActionLoading(-1);
      const { checkoutUrl } = await createProviderCheckout(
        plan,
        `${window.location.origin}/provider?upgrade=success`,
        `${window.location.origin}/provider?upgrade=cancelled`
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(-1);
      const { portalUrl } = await createProviderBillingPortal(
        `${window.location.origin}/provider`
      );
      window.location.href = portalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setActionLoading(null);
    }
  };

  // ============================================================================
  // Render: Onboarding
  // ============================================================================
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Become a Service Provider
            </h1>
            <p className="text-gray-600 mb-6">
              Set up your profile to list your pet services on BreederHQ Marketplace.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={onboardingData.businessName}
                  onChange={(e) =>
                    setOnboardingData((prev) => ({ ...prev, businessName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={onboardingData.email}
                  onChange={(e) =>
                    setOnboardingData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@yourbusiness.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={onboardingData.phone}
                  onChange={(e) =>
                    setOnboardingData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={onboardingData.website}
                  onChange={(e) =>
                    setOnboardingData((prev) => ({ ...prev, website: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={onboardingData.city}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={onboardingData.state}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateProfile}
                disabled={
                  !onboardingData.businessName ||
                  !onboardingData.email ||
                  actionLoading === -1
                }
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === -1 ? "Creating..." : "Create Profile"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Loading
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // ============================================================================
  // Render: Main Dashboard
  // ============================================================================
  // Free during early access - no listing limits
  const canCreateListing = true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {profile?.businessName || "Service Provider Portal"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Free during early access
              </span>
              <span className="text-sm text-gray-500">
                {dashboard?.limits.currentListings || 0} listing{dashboard?.limits.currentListings === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500">
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {(["dashboard", "listings", "settings"] as ViewMode[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                view === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard View */}
        {view === "dashboard" && dashboard && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Listings" value={dashboard.stats.totalListings} />
              <StatCard label="Active Listings" value={dashboard.stats.activeListings} />
              <StatCard label="Total Views" value={dashboard.stats.totalViews} />
              <StatCard label="Total Inquiries" value={dashboard.stats.totalInquiries} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleOpenListingModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Add Listing
                </button>
                <button
                  onClick={() => setView("listings")}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Manage Listings
                </button>
              </div>
              <p className="mt-3 text-sm text-green-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Unlimited listings during early access
              </p>
            </div>

            {/* Early Access Callout - replaces plan upgrade */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                🎉 Free During Early Access
              </h2>
              <p className="text-gray-600 mb-4">
                Create unlimited service listings at no cost while we're in early access. Build your presence on the marketplace today!
              </p>
            </div>
          </div>
        )}

        {/* Listings View */}
        {view === "listings" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Your Listings</h2>
              <button
                onClick={() => handleOpenListingModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Listing
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">
                  You haven't created any listings yet.
                </p>
                <button
                  onClick={() => handleOpenListingModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">
                            {SERVICE_TYPE_LABELS[listing.listingType]}
                          </span>
                          <StatusBadge status={listing.status} />
                        </div>
                        <h3 className="font-medium text-gray-900">{listing.title}</h3>
                        {listing.city && listing.state && (
                          <p className="text-sm text-gray-500">
                            {listing.city}, {listing.state}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{listing.viewCount} views</span>
                          <span>{listing.inquiryCount} inquiries</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenListingModal(listing)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                        {listing.status === "DRAFT" || listing.status === "PAUSED" ? (
                          <button
                            onClick={() => handlePublish(listing.id)}
                            disabled={actionLoading === listing.id}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublish(listing.id)}
                            disabled={actionLoading === listing.id}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Pause
                          </button>
                        )}
                        {deleteConfirm === listing.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={actionLoading === listing.id}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs text-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(listing.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {view === "settings" && profile && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Business Name</span>
                <p className="font-medium">{profile.businessName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone</span>
                <p className="font-medium">{profile.phone || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Website</span>
                <p className="font-medium">{profile.website || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Location</span>
                <p className="font-medium">
                  {profile.city && profile.state
                    ? `${profile.city}, ${profile.state}`
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free during early access
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Listing Modal */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingListing ? "Edit Listing" : "Create Listing"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <select
                  value={listingFormData.listingType}
                  onChange={(e) =>
                    setListingFormData((prev) => ({
                      ...prev,
                      listingType: e.target.value as ProviderServiceType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Service Type - shown when OTHER_SERVICE is selected */}
              {listingFormData.listingType === "OTHER_SERVICE" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What type of service do you offer? *
                  </label>
                  <input
                    type="text"
                    value={listingFormData.customServiceType || ""}
                    onChange={(e) =>
                      setListingFormData((prev) => ({ ...prev, customServiceType: e.target.value }))
                    }
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Equine Massage Therapy"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">
                    {listingFormData.customServiceType?.length || 0}/50 characters
                  </p>
                  <div className="mt-3 text-sm text-gray-700">
                    <p className="font-medium mb-1">Examples of services:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5 ml-4">
                      <li>• Animal Photography & Videography</li>
                      <li>• Pet Sitting & Dog Walking</li>
                      <li>• Behavioral Consultation</li>
                      <li>• Microchipping & DNA Testing</li>
                      <li>• Show Handling & Coaching</li>
                      <li>• Canine Nutrition Consulting</li>
                      <li>• Facility Design & Setup</li>
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={listingFormData.title}
                  onChange={(e) =>
                    setListingFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Professional Dog Training Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={listingFormData.description}
                  onChange={(e) =>
                    setListingFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your service..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={listingFormData.city}
                    onChange={(e) =>
                      setListingFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={listingFormData.state}
                    onChange={(e) =>
                      setListingFormData((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing
                </label>
                <select
                  value={listingFormData.priceType}
                  onChange={(e) =>
                    setListingFormData((prev) => ({
                      ...prev,
                      priceType: e.target.value as "fixed" | "starting_at" | "contact",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="contact">Contact for pricing</option>
                  <option value="fixed">Fixed price</option>
                  <option value="starting_at">Starting at</option>
                </select>
              </div>

              {listingFormData.priceType !== "contact" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={
                      listingFormData.priceCents
                        ? listingFormData.priceCents / 100
                        : ""
                    }
                    onChange={(e) =>
                      setListingFormData((prev) => ({
                        ...prev,
                        priceCents: e.target.value
                          ? Math.round(parseFloat(e.target.value) * 100)
                          : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowListingModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveListing}
                disabled={!listingFormData.title || actionLoading === -1}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === -1 ? "Saving..." : editingListing ? "Save Changes" : "Create Listing"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderDashboardPage;
