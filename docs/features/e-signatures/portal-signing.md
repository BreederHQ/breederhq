# Portal Signing Experience

## Overview

Buyers sign contracts through the BreederHQ Portal. This document covers the buyer-facing signing flow and UI components.

## Signing Flow

```
Email Invitation
      ↓
Portal Login/Auth
      ↓
Contract View (logs "viewed" event)
      ↓
Review Document
      ↓
Capture Signature
      ↓
Consent Checkbox
      ↓
Submit Signature (logs "signed" event)
      ↓
Confirmation Page
      ↓
Email with PDF (if all parties signed)
```

## Accessing a Contract

### Email Link
Buyers receive an email with a direct link:
```
https://portal.breederhq.com/contracts/{id}/sign
```

### Portal Navigation
Buyers can also access pending contracts from:
- Portal dashboard → Pending Actions
- Agreements section → Pending tab

## Contract Signing Page

**File:** `apps/portal/src/pages/PortalContractSigningPage.tsx`

### Page Sections

1. **Header**
   - Contract title
   - Expiration date (if set)
   - Status indicators

2. **Parties Summary**
   - List of all parties
   - Role labels (Seller, Buyer, etc.)
   - Signing status badges

3. **Document Viewer**
   - Rendered contract HTML
   - Scrollable container
   - Read-only display

4. **Signature Capture**
   - Mode tabs (Typed/Drawn based on tier)
   - Signature input area
   - Preview of captured signature

5. **Consent Checkbox**
   - Legal consent text
   - Link to ESIGN Act

6. **Actions**
   - Sign Contract button
   - Decline to Sign option

---

## Signature Capture Components

### SignatureCapture
**File:** `apps/portal/src/components/signing/SignatureCapture.tsx`

Main container that manages:
- Active signature mode (typed/drawn)
- Signature data state
- Consent state
- Callback to parent with captured data

```typescript
interface SignatureCaptureData {
  type: "typed" | "drawn";
  typedName?: string;
  drawnImageBase64?: string;
  consent: boolean;
}
```

### TypedSignatureInput
**File:** `apps/portal/src/components/signing/TypedSignatureInput.tsx`

- Text input for typing name
- Cursive font preview of signature
- Available on all tiers

### DrawnSignatureCanvas
**File:** `apps/portal/src/components/signing/DrawnSignatureCanvas.tsx`

- HTML5 canvas for drawing
- Touch and mouse support
- Clear button to reset
- Pro tier only

### SigningConsentCheckbox
**File:** `apps/portal/src/components/signing/SigningConsentCheckbox.tsx`

- Required consent checkbox
- Legal text about electronic signatures
- Link to ESIGN Act PDF

---

## Signature Options by Tier

| Tier | Typed | Drawn | Upload |
|------|-------|-------|--------|
| Breeder ($39) | ✓ | - | - |
| Pro ($99) | ✓ | ✓ | ✓ |

The API returns available options:
```json
{
  "signatureOptions": {
    "allowTyped": true,
    "allowDrawn": true,
    "allowUploaded": false
  }
}
```

---

## Contract States

### Signable States
Contracts can be signed when status is:
- `sent` - Initial state after breeder sends
- `viewed` - After buyer first views

### Non-Signable States
Display appropriate message for:
- `signed` - Already fully executed
- `declined` - Declined by a party
- `expired` - Past expiration date
- `voided` - Cancelled by breeder
- `draft` - Not yet sent (shouldn't reach portal)

---

## Decline Flow

Buyers can decline to sign:

1. Click "Decline to Sign" button
2. Modal appears with warning
3. Optional reason text input
4. Confirm decline action
5. Contract status → `declined`
6. Breeder notified via email

### Decline Modal
```
┌────────────────────────────────────┐
│ ⚠️ Decline Contract?               │
│                                    │
│ Are you sure you want to decline   │
│ this contract? This action cannot  │
│ be undone.                         │
│                                    │
│ Reason (optional):                 │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│        [Cancel]  [Decline Contract]│
└────────────────────────────────────┘
```

---

## Success States

### After Signing
```
┌────────────────────────────────────┐
│         ✓ Contract Signed          │
│          Successfully!             │
│                                    │
│ Thank you for signing. You will    │
│ receive a copy of the signed       │
│ document via email.                │
│                                    │
│       [Return to Agreements]       │
└────────────────────────────────────┘
```

### If All Parties Have Signed
- Contract status → `signed`
- PDF generated automatically
- Email sent to all parties with PDF attachment

---

## Audit Trail

Every action is logged with:

| Field | Description |
|-------|-------------|
| `status` | Event type (viewed, signed, declined) |
| `at` | ISO timestamp |
| `ipAddress` | Client IP (respects X-Forwarded-For) |
| `userAgent` | Browser user agent string |
| `message` | Human-readable event description |
| `partyId` | ContractParty who performed action |

### IP Address Handling
The system captures the real client IP:
- Checks `X-Forwarded-For` header (Cloudflare, proxies)
- Falls back to `X-Real-IP`
- Uses socket address as last resort

---

## Mobile Considerations

The signing UI is fully responsive:

- Document viewer scrolls vertically
- Signature canvas scales to container
- Touch events supported for drawing
- Buttons are touch-friendly (44px min height)

### Canvas on Mobile
- Prevents page scroll while drawing
- Supports touch drawing
- Clear button easily accessible

---

## Accessibility

The signing experience follows accessibility best practices:

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- High contrast text on buttons
- Screen reader friendly status messages

---

## Error Handling

### Load Errors
If contract fails to load:
- Display error message
- Suggest refreshing or contacting breeder

### Signature Submission Errors
If signing fails:
- Display error inline
- Don't lose signature data
- Allow retry

### Network Errors
- Graceful degradation
- Clear error messaging
- Retry guidance
