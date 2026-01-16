// apps/marketplace/src/provider/components/ProfileCompletenessWidget.tsx
// Profile completeness indicator with actionable suggestions

import React from "react";
import type { ServiceProviderProfile, ProviderListingItem } from "../../api/client";

interface CompletenessItem {
  id: string;
  label: string;
  completed: boolean;
  points: number;
  action?: string;
  actionHint?: string;
}

interface ProfileCompletenessProps {
  profile: ServiceProviderProfile | null;
  listings: ProviderListingItem[];
}

export function ProfileCompletenessWidget({ profile, listings }: ProfileCompletenessProps) {
  // Calculate completeness score
  const items: CompletenessItem[] = React.useMemo(() => {
    if (!profile) return [];

    const activeListings = listings.filter(l => l.status === "ACTIVE");
    const hasDetailedDescription = activeListings.some(l => (l.description?.length || 0) > 200);
    const hasPhotos = activeListings.some(l => (l.images?.length || 0) > 0);
    const hasTags = activeListings.some(l => (l.tags?.length || 0) > 0);
    const hasLocation = activeListings.some(l => l.city && l.state);

    return [
      {
        id: "profile",
        label: "Business profile created",
        completed: true, // They have a profile if they're here
        points: 15,
      },
      {
        id: "listing",
        label: "At least one active listing",
        completed: activeListings.length > 0,
        points: 20,
        action: "Create your first listing",
        actionHint: "Click '+ Add Listing' to get started",
      },
      {
        id: "description",
        label: "Detailed service description (200+ characters)",
        completed: hasDetailedDescription,
        points: 15,
        action: "Add detailed descriptions",
        actionHint: "Listings with detailed descriptions get 3x more inquiries",
      },
      {
        id: "photos",
        label: "Service photos added",
        completed: hasPhotos,
        points: 20,
        action: "Add photos to your listings",
        actionHint: "Listings with photos get 5x more inquiries",
      },
      {
        id: "location",
        label: "Location information",
        completed: hasLocation,
        points: 10,
        action: "Add your service location",
        actionHint: "Help buyers find local services",
      },
      {
        id: "tags",
        label: "Service tags for discovery",
        completed: hasTags,
        points: 10,
        action: "Add tags to your listings",
        actionHint: "Tags help buyers discover your services",
      },
      {
        id: "contact",
        label: "Contact information",
        completed: !!(profile.email && profile.phone),
        points: 10,
        action: "Add phone number",
        actionHint: "Make it easy for buyers to reach you",
      },
    ];
  }, [profile, listings]);

  const completedItems = items.filter(i => i.completed);
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = completedItems.reduce((sum, item) => sum + item.points, 0);
  const completeness = Math.round((earnedPoints / totalPoints) * 100);

  // Determine status message and color
  const getStatusInfo = () => {
    if (completeness >= 80) {
      return {
        message: "Excellent! Your profile is optimized",
        color: "text-green-600",
        bgColor: "bg-green-50",
        barColor: "bg-green-600",
      };
    } else if (completeness >= 60) {
      return {
        message: "Good progress! A few more steps",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        barColor: "bg-blue-600",
      };
    } else if (completeness >= 40) {
      return {
        message: "Getting there! Complete your profile",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        barColor: "bg-yellow-600",
      };
    } else {
      return {
        message: "Let's complete your profile",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        barColor: "bg-orange-600",
      };
    }
  };

  const status = getStatusInfo();
  const incompleteItems = items.filter(i => !i.completed);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 ${status.bgColor} border-b border-gray-200`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Completeness</h3>
            <p className={`text-sm ${status.color} font-medium mt-0.5`}>
              {status.message}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{completeness}%</div>
            <div className="text-xs text-gray-600">{earnedPoints}/{totalPoints} points</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <div
            className={`${status.barColor} h-full rounded-full transition-all duration-500`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="p-6">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                item.completed
                  ? "bg-green-50"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {/* Checkbox */}
              <div className="pt-0.5">
                {item.completed ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${item.completed ? "text-green-900" : "text-gray-700"}`}>
                    {item.label}
                  </span>
                  <span className={`text-xs font-medium ${item.completed ? "text-green-600" : "text-gray-500"}`}>
                    +{item.points}pts
                  </span>
                </div>
                {!item.completed && item.actionHint && (
                  <p className="text-xs text-gray-600 mt-1">
                    {item.actionHint}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Impact Message */}
        {completeness < 80 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Why complete your profile?
                </p>
                <p className="text-xs text-blue-800">
                  Profiles 80%+ complete receive 3x more inquiries. Complete profiles show up higher in search results and build trust with potential clients.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Celebration */}
        {completeness >= 80 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm font-semibold text-green-900 mb-1">
              Great work! Your profile is optimized
            </p>
            <p className="text-xs text-green-800">
              You're all set to attract more clients. Keep your listings updated and respond quickly to inquiries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCompletenessWidget;
