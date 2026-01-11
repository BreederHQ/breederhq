# Origin Tracking

Documentation for conversion attribution and origin tracking across the marketplace.

## Overview

Origin tracking captures the source of user conversions (inquiries, waitlist requests, etc.) to enable attribution analytics. This helps breeders and service providers understand:
- Where buyers are coming from
- Which marketing channels are effective
- Which listings drive the most engagement

## Tracked Data

### Origin Fields

| Field | Description | Example |
|-------|-------------|---------|
| `originSource` | Traffic source identifier | `"google"`, `"facebook"`, `"direct"` |
| `originReferrer` | Full referrer URL | `"https://google.com/search?q=..."` |
| `originUtmSource` | UTM source parameter | `"newsletter"` |
| `originUtmMedium` | UTM medium parameter | `"email"` |
| `originUtmCampaign` | UTM campaign parameter | `"spring_2026"` |
| `originPagePath` | Page where conversion happened | `"/programs/goldendoodle-program"` |
| `originProgramSlug` | Program associated with conversion | `"goldendoodle-program"` |

## Data Model

### MessageThread (Inquiries)

```prisma
model MessageThread {
  // ... existing fields ...

  // Origin tracking
  originSource      String?
  originReferrer    String?
  originUtmSource   String?
  originUtmMedium   String?
  originUtmCampaign String?
  originPagePath    String?
  originProgramSlug String?
}
```

### WaitlistEntry

```prisma
model WaitlistEntry {
  // ... existing fields ...

  // Origin tracking
  originSource      String?
  originReferrer    String?
  originUtmSource   String?
  originUtmMedium   String?
  originUtmCampaign String?
  originPagePath    String?
  originProgramSlug String?
}
```

## Frontend Implementation

### Origin Capture on Page Load

**File:** `apps/marketplace/src/utils/origin-tracking.ts`

```typescript
interface OriginData {
  source: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  pagePath: string | null;
  programSlug: string | null;
}

/**
 * Capture origin data on initial page load.
 * Call this once in main.tsx before app renders.
 */
export function captureOrigin(): void {
  // Only capture on first visit (don't overwrite existing)
  if (sessionStorage.getItem("origin_captured")) return;

  const params = new URLSearchParams(window.location.search);

  const origin: OriginData = {
    source: detectSource(document.referrer),
    referrer: document.referrer || null,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    pagePath: window.location.pathname,
    programSlug: null, // Set later when viewing specific program
  };

  sessionStorage.setItem("origin_data", JSON.stringify(origin));
  sessionStorage.setItem("origin_captured", "true");
}

/**
 * Get stored origin data for conversion actions.
 */
export function getOriginData(): OriginData | null {
  const stored = sessionStorage.getItem("origin_data");
  return stored ? JSON.parse(stored) : null;
}

/**
 * Update origin with current program context.
 */
export function setOriginProgramSlug(slug: string): void {
  const origin = getOriginData();
  if (origin) {
    origin.programSlug = slug;
    sessionStorage.setItem("origin_data", JSON.stringify(origin));
  }
}
```

### Source Detection Logic

```typescript
function detectSource(referrer: string): string | null {
  if (!referrer) return "direct";

  const url = new URL(referrer);
  const host = url.hostname.toLowerCase();

  if (host.includes("google")) return "google";
  if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
  if (host.includes("instagram")) return "instagram";
  if (host.includes("twitter") || host.includes("x.com")) return "twitter";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("pinterest")) return "pinterest";
  if (host.includes("youtube")) return "youtube";
  if (host.includes("breederhq.com")) return "internal";

  return "referral";
}
```

### App Initialization

**File:** `apps/marketplace/src/main.tsx`

```typescript
// Capture origin data on initial load
import { captureOrigin } from "./utils/origin-tracking";
captureOrigin();
```

## API Integration

### Inquiry Submission

**File:** `apps/marketplace/src/api/client.ts`

```typescript
interface OriginPayload {
  source?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  pagePath?: string | null;
  programSlug?: string | null;
}

export async function submitInquiry(payload: {
  breederTenantId: number;
  subject: string;
  message: string;
  listingId?: number;
  listingType?: string;
  origin?: OriginPayload;
}): Promise<InquiryResponse> {
  // Include origin data from session storage
  const originData = getOriginData();

  const response = await fetch(joinApi("/api/v1/marketplace/inquiries"), {
    method: "POST",
    credentials: "include",
    headers: getHeaders(),
    body: JSON.stringify({
      ...payload,
      origin: originData,
    }),
  });
  // ...
}
```

### Backend Handling

**File:** `breederhq-api/src/routes/public-marketplace.ts`

```typescript
app.post("/inquiries", async (req, reply) => {
  const { breederTenantId, subject, message, listingId, listingType, origin } = req.body;

  const thread = await prisma.messageThread.create({
    data: {
      // ... thread fields ...

      // Origin tracking
      originSource: origin?.source || null,
      originReferrer: origin?.referrer || null,
      originUtmSource: origin?.utmSource || null,
      originUtmMedium: origin?.utmMedium || null,
      originUtmCampaign: origin?.utmCampaign || null,
      originPagePath: origin?.pagePath || null,
      originProgramSlug: origin?.programSlug || null,
    },
  });

  // ...
});
```

## Usage in Components

### Listing Page Example

```typescript
// apps/marketplace/src/marketplace/pages/ListingPage.tsx
import { setOriginProgramSlug, getOriginData } from "../../utils/origin-tracking";

function ListingPage() {
  const { programSlug } = useParams();

  // Track which program the user is viewing
  useEffect(() => {
    if (programSlug) {
      setOriginProgramSlug(programSlug);
    }
  }, [programSlug]);

  const handleInquire = async () => {
    const origin = getOriginData();
    await submitInquiry({
      breederTenantId,
      subject: `Inquiry about ${listing.title}`,
      message,
      listingId: listing.id,
      origin,
    });
  };
}
```

## Analytics Queries

### Inquiries by Source

```sql
SELECT
  origin_source,
  COUNT(*) as inquiry_count
FROM message_thread
WHERE origin_source IS NOT NULL
GROUP BY origin_source
ORDER BY inquiry_count DESC;
```

### Conversion by UTM Campaign

```sql
SELECT
  origin_utm_campaign,
  COUNT(*) as conversions
FROM message_thread
WHERE origin_utm_campaign IS NOT NULL
GROUP BY origin_utm_campaign
ORDER BY conversions DESC;
```

### Program Performance

```sql
SELECT
  origin_program_slug,
  COUNT(*) as inquiries,
  COUNT(DISTINCT buyer_user_id) as unique_buyers
FROM message_thread
WHERE origin_program_slug IS NOT NULL
GROUP BY origin_program_slug
ORDER BY inquiries DESC;
```

## Best Practices

1. **Capture Early** - Call `captureOrigin()` as early as possible in app initialization
2. **Don't Overwrite** - Only capture on first visit to preserve true origin
3. **Update Context** - Call `setOriginProgramSlug()` when user views specific programs
4. **Include in All Conversions** - Pass origin data in all conversion actions (inquiries, waitlist, reservations)

## Privacy Considerations

- Origin data is associated with user actions, not passive browsing
- Referrer URLs are stored but not displayed publicly
- UTM parameters are standard marketing tracking
- No cross-site tracking or third-party cookies used

## Related

- [API Reference](./api-reference.md) - Inquiry and waitlist endpoints
- [Breeding Programs](./breeding-programs.md) - Program context tracking
