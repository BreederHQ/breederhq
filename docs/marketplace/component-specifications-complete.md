# Complete Component Specifications (All 24 Components)

## Navigation Components (4)

### 1. TopNav

**Purpose**: Primary desktop navigation header

**Anatomy**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  Browse ▾  My Program ▾  Messages(3)  [🔍]  [Avatar ▾] │
└─────────────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| user | User \| null | No | null | Current user object |
| unreadMessages | number | No | 0 | Unread message count |
| unreadInquiries | number | No | 0 | Unread inquiry count |
| onSearch | function | No | - | Search callback |
| currentPath | string | Yes | - | Current route for active state |

**States**:
- Logged Out: Show [Login] [Sign Up] buttons
- Logged In (Buyer): Show Messages, Saved, Account
- Logged In (Breeder): Show My Program dropdown, Messages, Account
- Search Active: Expanded search input

**Accessibility**:
- `role="navigation"` with `aria-label="Main navigation"`
- Dropdown menus keyboard accessible
- Focus trap in open dropdowns
- Badge counts announced to screen readers

---

### 2. BottomTabBar

**Purpose**: Primary mobile navigation

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│  [🏠]      [🔍]      [💬]      [♡]      [👤]          │
│  Home     Browse   Messages   Saved    Account         │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| activeTab | string | Yes | - | Currently active tab |
| unreadMessages | number | No | 0 | Badge count for messages |
| savedCount | number | No | 0 | Badge count for saved |
| onTabChange | function | Yes | - | Tab change callback |

**States**:
- Active: Filled icon, primary color
- Inactive: Outlined icon, gray
- Badge: Red dot with count (max "99+")

**Accessibility**:
- `role="tablist"` container
- Each tab has `role="tab"` and `aria-selected`
- Badge counts use `aria-label` (e.g., "Messages, 3 unread")
- 44px minimum touch targets

---

### 3. Breadcrumb

**Purpose**: Show navigation hierarchy and enable backtracking

**Anatomy**:
```
Home > Browse > Dogs > German Shepherd > [Current Page]
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| items | BreadcrumbItem[] | Yes | - | Array of {label, href} |
| maxItems | number | No | 4 | Max items before collapsing |
| separator | ReactNode | No | ">" | Separator element |

**BreadcrumbItem**:
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string; // Optional for current page
}
```

**States**:
- Collapsed: Shows first, ellipsis menu, last 2 items
- Full: Shows all items when space permits
- Current: Last item not clickable, bolder weight

**Accessibility**:
- `nav` element with `aria-label="Breadcrumb"`
- Current page has `aria-current="page"`
- Collapsed items in dropdown accessible via keyboard

---

### 4. TabGroup

**Purpose**: Organize content into switchable sections

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ [Tab 1 (active)]  [Tab 2]  [Tab 3]  [Tab 4]            │
├─────────────────────────────────────────────────────────┤
│ Tab content panel                                       │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| tabs | Tab[] | Yes | - | Array of tab definitions |
| activeTab | string | Yes | - | Currently active tab id |
| onChange | function | Yes | - | Tab change callback |
| variant | 'underline' \| 'pill' | No | 'underline' | Visual variant |

**Tab**:
```typescript
interface Tab {
  id: string;
  label: string;
  count?: number; // Optional count badge
  disabled?: boolean;
}
```

**States**:
- Active: Underline/filled, primary color
- Inactive: No underline, gray text
- Disabled: Gray text, not clickable
- With Count: Badge after label

**Accessibility**:
- `role="tablist"` container
- Tabs have `role="tab"`, panels have `role="tabpanel"`
- Arrow keys navigate between tabs
- `aria-selected` indicates active tab

---

## Card Components (4)

### 5. AnimalCard

**Purpose**: Display animal listing preview in grids

**Anatomy**:
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │       IMAGE             │ │
│ │                   [✓]   │ │  ← Verification badge
│ └─────────────────────────┘ │
│ Title of Animal Listing     │
│ $2,500 · Denver, CO         │
│ ★★★★☆ (23)           [♡]   │
└─────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | string | Yes | - | Unique listing ID |
| title | string | Yes | - | Listing title (max 60 chars) |
| imageUrl | string | Yes | - | Primary image URL |
| price | number | Yes | - | Price in cents |
| priceType | 'fixed' \| 'negotiable' \| 'contact' | No | 'fixed' | Price display type |
| location | string | Yes | - | City, State |
| isVerified | boolean | No | false | Show verification badge |
| rating | number | No | - | Average rating (1-5) |
| reviewCount | number | No | 0 | Number of reviews |
| isSaved | boolean | No | false | Saved state |
| status | 'available' \| 'pending' \| 'sold' | No | 'available' | Listing status |
| onSave | function | No | - | Save toggle callback |
| onClick | function | No | - | Card click callback |

**States**:
| State | Visual |
|-------|--------|
| Default | Standard display |
| Hover | Elevation increase, subtle scale |
| Saved | Filled heart icon (red) |
| Loading | Skeleton placeholder |
| Unavailable | Grayed, "Sold" overlay |
| Pending | "Pending" badge |

**Accessibility**:
- Card is button or link with descriptive `aria-label`
- Save button has `aria-pressed` state
- Image has meaningful alt text
- Price announced with currency

---

### 6. ProgramCard

**Purpose**: Display breeder program preview

**Anatomy**:
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │         COVER IMAGE                 │ │
│ └─────────────────────────────────────┘ │
│ ┌────┐                                  │
│ │Avtr│ Summit Shepherds        ✓       │
│ └────┘ German Shepherds · Denver, CO   │
│        ★★★★★ (47 reviews)              │
│        [View Program]                   │
└─────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | string | Yes | - | Program ID |
| name | string | Yes | - | Program name |
| coverImage | string | No | - | Cover image URL |
| avatarUrl | string | No | - | Avatar image URL |
| breed | string | Yes | - | Primary breed |
| location | string | Yes | - | City, State |
| isVerified | boolean | No | false | Verification status |
| rating | number | No | - | Average rating |
| reviewCount | number | No | 0 | Review count |
| onClick | function | No | - | Card click callback |

**States**:
- Default, Hover, Loading
- No Cover: Show placeholder gradient

---

### 7. ServiceCard

**Purpose**: Display service provider listing

**Anatomy**:
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │         SERVICE IMAGE               │ │
│ │                               [✓]   │ │
│ └─────────────────────────────────────┘ │
│ Professional Dog Training               │
│ Starting at $75/session                 │
│ Denver, CO · 25 mi radius              │
│ ★★★★★ (34)                    [♡]     │
└─────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | string | Yes | - | Service ID |
| title | string | Yes | - | Service title |
| imageUrl | string | No | - | Service image |
| priceFrom | number | Yes | - | Starting price |
| pricePer | string | Yes | - | Price unit (session, hour, etc.) |
| location | string | Yes | - | Service area |
| isVerified | boolean | No | false | Verified provider |
| rating | number | No | - | Average rating |
| reviewCount | number | No | 0 | Review count |
| isSaved | boolean | No | false | Saved state |
| category | string | Yes | - | Service category |
| onSave | function | No | - | Save callback |
| onClick | function | No | - | Click callback |

---

### 8. InquiryCard

**Purpose**: Display inquiry preview in inbox list

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ ● [Avatar] John Smith                      2 hours ago │
│            Re: Champion GSD Puppy                      │
│            "Hi, I'm interested in your puppy..."       │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | string | Yes | - | Inquiry ID |
| senderName | string | Yes | - | Sender name |
| senderAvatar | string | No | - | Avatar URL |
| subject | string | Yes | - | Inquiry subject (listing title) |
| preview | string | Yes | - | Message preview (truncated) |
| timestamp | Date | Yes | - | Last message time |
| isUnread | boolean | No | false | Unread indicator |
| isStarred | boolean | No | false | Starred status |
| onClick | function | No | - | Click callback |
| onStar | function | No | - | Star toggle callback |

**States**:
- Unread: Blue dot, bold text
- Read: Normal weight
- Starred: Yellow star icon
- Selected: Background highlight

---

## Form Components (6)

### 9. TextField

**Purpose**: Single-line text input

**Anatomy**:
```
┌─────────────────────────────────────────┐
│ Label *                                 │
│ ┌─────────────────────────────────────┐ │
│ │ [icon] Placeholder text...          │ │
│ └─────────────────────────────────────┘ │
│ Helper text or error message            │
└─────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | Yes | - | Input label |
| name | string | Yes | - | Form field name |
| type | 'text' \| 'email' \| 'password' \| 'tel' \| 'url' | No | 'text' | Input type |
| placeholder | string | No | - | Placeholder text |
| value | string | Yes | - | Controlled value |
| onChange | function | Yes | - | Change handler |
| onBlur | function | No | - | Blur handler |
| error | string | No | - | Error message |
| helperText | string | No | - | Helper text |
| required | boolean | No | false | Required field |
| disabled | boolean | No | false | Disabled state |
| readOnly | boolean | No | false | Read-only state |
| leadingIcon | ReactNode | No | - | Icon inside input |
| trailingIcon | ReactNode | No | - | Icon at end |
| maxLength | number | No | - | Character limit |
| showCount | boolean | No | false | Show character count |
| autoComplete | string | No | - | Autocomplete attribute |

**States**:
- Default: Gray border
- Focus: Primary color border + ring
- Error: Red border + error message
- Disabled: Gray background
- Read-only: Subtle background

**Accessibility**:
- Label linked via `htmlFor`/`id`
- Error uses `aria-invalid` and `aria-describedby`
- Required uses `aria-required`
- Character count announced on change

---

### 10. TextArea

**Purpose**: Multi-line text input

**Props**: Same as TextField plus:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| rows | number | No | 4 | Initial visible rows |
| minRows | number | No | 2 | Minimum rows |
| maxRows | number | No | 10 | Maximum rows (auto-grow) |
| resize | 'none' \| 'vertical' \| 'both' | No | 'vertical' | Resize behavior |

---

### 11. Select

**Purpose**: Dropdown selection input

**Anatomy**:
```
┌─────────────────────────────────────────┐
│ Label *                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Selected option                  ▾  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Option 1                            │ │
│ │ Option 2 ✓                          │ │
│ │ Option 3                            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | Yes | - | Input label |
| name | string | Yes | - | Form field name |
| options | Option[] | Yes | - | Available options |
| value | string \| string[] | Yes | - | Selected value(s) |
| onChange | function | Yes | - | Change handler |
| placeholder | string | No | "Select..." | Placeholder |
| multiple | boolean | No | false | Allow multiple selection |
| searchable | boolean | No | false | Enable search/filter |
| error | string | No | - | Error message |
| required | boolean | No | false | Required field |
| disabled | boolean | No | false | Disabled state |

**Option**:
```typescript
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string; // For grouped options
}
```

**Accessibility**:
- Uses `role="listbox"` pattern
- Arrow keys navigate options
- Type-ahead search
- Selected option announced

---

### 12. Checkbox

**Purpose**: Single or grouped checkbox inputs

**Anatomy**:
```
☑ Label text
  Helper text (optional)
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | Yes | - | Checkbox label |
| name | string | Yes | - | Form field name |
| checked | boolean | Yes | - | Checked state |
| onChange | function | Yes | - | Change handler |
| helperText | string | No | - | Additional context |
| disabled | boolean | No | false | Disabled state |
| indeterminate | boolean | No | false | Partial selection |
| error | string | No | - | Error message |

**States**:
- Unchecked: Empty box
- Checked: Filled with checkmark
- Indeterminate: Dash/minus
- Disabled: Grayed out
- Error: Red border

---

### 13. Radio

**Purpose**: Radio button group for single selection

**Anatomy**:
```
Radio Group Label
○ Option 1
● Option 2 (selected)
○ Option 3
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | Yes | - | Group label |
| name | string | Yes | - | Form field name |
| options | RadioOption[] | Yes | - | Available options |
| value | string | Yes | - | Selected value |
| onChange | function | Yes | - | Change handler |
| orientation | 'vertical' \| 'horizontal' | No | 'vertical' | Layout direction |
| error | string | No | - | Error message |
| required | boolean | No | false | Required field |

**Accessibility**:
- `role="radiogroup"` container
- Arrow keys navigate options
- Only selected option in tab order

---

### 14. FileUpload

**Purpose**: Image and document upload

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│                    DROP ZONE                            │
│   [📷]                                                  │
│   Drag photos here or click to upload                  │
│   PNG, JPG up to 10MB · Max 10 photos                  │
└─────────────────────────────────────────────────────────┘
┌─────┐ ┌─────┐ ┌─────┐
│[img]│ │[img]│ │ + │
│ [×] │ │ [×] │ │     │
└─────┘ └─────┘ └─────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| accept | string | No | "image/*" | Accepted file types |
| maxFiles | number | No | 10 | Maximum files |
| maxSize | number | No | 10485760 | Max size in bytes (10MB) |
| files | File[] | Yes | - | Current files |
| onChange | function | Yes | - | Files change handler |
| onError | function | No | - | Error callback |
| multiple | boolean | No | true | Allow multiple files |
| preview | boolean | No | true | Show image previews |
| reorderable | boolean | No | true | Allow drag reorder |
| primaryIndex | number | No | 0 | Primary/featured image |
| onPrimaryChange | function | No | - | Primary change callback |

**States**:
- Default: Drop zone visible
- Drag Over: Highlighted border
- Uploading: Progress indicator per file
- Error: Red border, error message
- Full: Hide drop zone, show "Max reached"

---

## Feedback Components (4)

### 15. Button

**Purpose**: Primary action element

**Variants**:
```
Primary:    [████████████]  Filled, primary color
Secondary:  [────────────]  Outlined
Ghost:      [            ]  Text only
Danger:     [████████████]  Filled, error color
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' \| 'danger' | No | 'primary' | Visual variant |
| size | 'sm' \| 'md' \| 'lg' | No | 'md' | Button size |
| disabled | boolean | No | false | Disabled state |
| loading | boolean | No | false | Loading state |
| fullWidth | boolean | No | false | Full container width |
| leftIcon | ReactNode | No | - | Icon before text |
| rightIcon | ReactNode | No | - | Icon after text |
| onClick | function | No | - | Click handler |
| type | 'button' \| 'submit' | No | 'button' | Button type |
| as | 'button' \| 'a' | No | 'button' | Element type |
| href | string | No | - | Link URL (when as="a") |

**Sizes**:
| Size | Height | Padding X | Font Size | Icon Size |
|------|--------|-----------|-----------|-----------|
| sm | 32px | 12px | 12px | 16px |
| md | 40px | 16px | 14px | 20px |
| lg | 48px | 20px | 16px | 24px |

**States**:
- Default, Hover, Pressed, Disabled, Loading
- Loading shows spinner, text changes to "Loading..."

**Accessibility**:
- Minimum 44px touch target on mobile
- Focus ring (2px primary color)
- Disabled removes from tab order
- Loading announced to screen readers

---

### 16. Toast

**Purpose**: Temporary notification messages

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ [✓] Changes saved successfully                     [×] │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| message | string | Yes | - | Toast message |
| type | 'success' \| 'error' \| 'warning' \| 'info' | No | 'info' | Toast type |
| duration | number | No | 5000 | Auto-dismiss time (ms) |
| action | ToastAction | No | - | Optional action button |
| onDismiss | function | No | - | Dismiss callback |
| position | 'top' \| 'bottom' | No | 'bottom' | Screen position |

**ToastAction**:
```typescript
interface ToastAction {
  label: string;
  onClick: () => void;
}
```

**Types**:
| Type | Icon | Color |
|------|------|-------|
| success | Checkmark | Green |
| error | X circle | Red |
| warning | Alert triangle | Yellow |
| info | Info circle | Blue |

**Accessibility**:
- `role="alert"` for errors
- `role="status"` for success/info
- Pause timer on hover
- Escape key dismisses

---

### 17. Modal

**Purpose**: Overlay dialog for confirmations and focused tasks

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░┌─────────────────────────────┐░░░░░░░░░░░░░░ │
│ ░░░░░░░░░│ Modal Title              [×]│░░░░░░░░░░░░░░ │
│ ░░░░░░░░░├─────────────────────────────┤░░░░░░░░░░░░░░ │
│ ░░░░░░░░░│    Modal content            │░░░░░░░░░░░░░░ │
│ ░░░░░░░░░├─────────────────────────────┤░░░░░░░░░░░░░░ │
│ ░░░░░░░░░│      [Cancel] [Confirm]     │░░░░░░░░░░░░░░ │
│ ░░░░░░░░░└─────────────────────────────┘░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | Yes | - | Open state |
| onClose | function | Yes | - | Close handler |
| title | string | Yes | - | Modal title |
| size | 'sm' \| 'md' \| 'lg' \| 'full' | No | 'md' | Modal size |
| children | ReactNode | Yes | - | Modal content |
| footer | ReactNode | No | - | Footer buttons |
| closeOnBackdrop | boolean | No | true | Close on backdrop click |
| closeOnEscape | boolean | No | true | Close on Escape key |
| showCloseButton | boolean | No | true | Show X button |
| preventScroll | boolean | No | true | Prevent body scroll |

**Sizes**:
| Size | Max Width | Use Case |
|------|-----------|----------|
| sm | 400px | Confirmations |
| md | 560px | Forms |
| lg | 720px | Complex content |
| full | 100% - 32px | Mobile full-screen |

**Accessibility**:
- Focus trapped within modal
- First focusable element receives focus
- Escape closes modal
- `role="dialog"` and `aria-modal="true"`
- Return focus to trigger on close

---

### 18. EmptyState

**Purpose**: Display when no content is available

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│                    [Illustration]                       │
│                                                         │
│                 No listings yet                         │
│          Create your first animal listing               │
│             to start receiving inquiries                │
│                                                         │
│              [Create Your First Listing]                │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| icon | ReactNode | No | - | Icon or illustration |
| title | string | Yes | - | Primary message |
| description | string | No | - | Secondary message |
| action | EmptyStateAction | No | - | CTA button |
| secondaryAction | EmptyStateAction | No | - | Secondary action |
| size | 'sm' \| 'md' \| 'lg' | No | 'md' | Component size |

**EmptyStateAction**:
```typescript
interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
}
```

---

## Content Components (4)

### 19. Avatar

**Purpose**: Display user or program profile images

**Anatomy**:
```
┌─────┐   ┌─────┐   ┌─────┐
│ IMG │   │ JS  │   │ ✓ │
└─────┘   └─────┘   └─────┘
 Image    Initials  With Badge
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| src | string | No | - | Image URL |
| alt | string | Yes | - | Alt text |
| name | string | No | - | Name for initials fallback |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | No | 'md' | Avatar size |
| shape | 'circle' \| 'square' | No | 'circle' | Avatar shape |
| badge | 'verified' \| 'online' \| ReactNode | No | - | Badge indicator |
| onClick | function | No | - | Click handler |

**Sizes**:
| Size | Dimension | Font Size |
|------|-----------|-----------|
| xs | 24px | 10px |
| sm | 32px | 12px |
| md | 40px | 14px |
| lg | 56px | 18px |
| xl | 80px | 24px |

**Fallback Order**:
1. Image (if valid src)
2. Initials (if name provided)
3. Default user icon

---

### 20. Badge

**Purpose**: Status indicators and labels

**Anatomy**:
```
[● Active]  [Pending]  [✓ Verified]  [5]
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | Yes | - | Badge text |
| variant | 'default' \| 'success' \| 'warning' \| 'error' \| 'info' | No | 'default' | Color variant |
| size | 'sm' \| 'md' | No | 'md' | Badge size |
| icon | ReactNode | No | - | Leading icon |
| dot | boolean | No | false | Show status dot |
| removable | boolean | No | false | Show remove button |
| onRemove | function | No | - | Remove callback |

**Variants**:
| Variant | Background | Text |
|---------|------------|------|
| default | Gray-100 | Gray-700 |
| success | Green-100 | Green-700 |
| warning | Yellow-100 | Yellow-700 |
| error | Red-100 | Red-700 |
| info | Blue-100 | Blue-700 |

---

### 21. ImageGallery

**Purpose**: Display and navigate multiple images

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │               MAIN IMAGE                            │ │
│ │                                                     │ │
│ │  [◀]                                         [▶]   │ │
│ │                    [1/8]                            │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │[th1]│ │[th2]│ │[th3]│ │[th4]│ │[th5]│ │[th6]│     │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘     │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| images | GalleryImage[] | Yes | - | Array of images |
| initialIndex | number | No | 0 | Starting image index |
| showThumbnails | boolean | No | true | Show thumbnail strip |
| showCounter | boolean | No | true | Show image counter |
| showNavigation | boolean | No | true | Show prev/next buttons |
| enableZoom | boolean | No | false | Enable zoom on click |
| enableFullscreen | boolean | No | false | Enable fullscreen mode |
| aspectRatio | string | No | "4:3" | Main image aspect ratio |
| onChange | function | No | - | Index change callback |

**GalleryImage**:
```typescript
interface GalleryImage {
  src: string;
  alt: string;
  thumbnail?: string; // Smaller version for strip
}
```

**Interactions**:
- Swipe left/right on mobile
- Arrow keys on desktop
- Click thumbnail to jump
- Pinch to zoom (if enabled)

---

### 22. PriceDisplay

**Purpose**: Consistent price formatting

**Anatomy**:
```
$2,500          $1,800 - $2,500         Contact for Price
Fixed           Range                    Contact
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| amount | number | No | - | Price in cents |
| amountMax | number | No | - | Max price for range |
| type | 'fixed' \| 'range' \| 'negotiable' \| 'contact' | No | 'fixed' | Price type |
| currency | string | No | 'USD' | Currency code |
| size | 'sm' \| 'md' \| 'lg' | No | 'md' | Display size |
| showCents | boolean | No | false | Show cents |
| strikethrough | number | No | - | Original price (crossed out) |

**Output Examples**:
- Fixed: "$2,500"
- Range: "$1,800 - $2,500"
- Negotiable: "$2,500 (negotiable)"
- Contact: "Contact for Price"
- With strikethrough: "~~$3,000~~ $2,500"

---

## Layout Components (2)

### 23. Card

**Purpose**: Container component for grouping content

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ Card Header (optional)                          [Action]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Card Body Content                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Card Footer (optional)                                  │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | Yes | - | Card content |
| header | ReactNode | No | - | Header content |
| footer | ReactNode | No | - | Footer content |
| padding | 'none' \| 'sm' \| 'md' \| 'lg' | No | 'md' | Internal padding |
| elevation | 0 \| 1 \| 2 \| 3 | No | 1 | Shadow level |
| border | boolean | No | true | Show border |
| hoverable | boolean | No | false | Hover effect |
| onClick | function | No | - | Click handler |
| as | string | No | 'div' | HTML element |

---

### 24. Skeleton

**Purpose**: Loading placeholder

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░                                 │
│ ░░░░░░░░░░░░░░                                          │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | 'text' \| 'circular' \| 'rectangular' | No | 'text' | Shape variant |
| width | string \| number | No | '100%' | Width |
| height | string \| number | No | - | Height (auto for text) |
| lines | number | No | 1 | Number of text lines |
| animation | 'pulse' \| 'wave' \| 'none' | No | 'pulse' | Animation type |
| className | string | No | - | Additional classes |

**Predefined Skeletons**:
```typescript
// Compound components for common patterns
<Skeleton.Card />      // Full card skeleton
<Skeleton.Avatar />    // Circular avatar
<Skeleton.Image />     // 4:3 image placeholder
<Skeleton.Button />    // Button-sized rectangle
<Skeleton.Text lines={3} />  // Multiple text lines
```

**Animation**:
- Pulse: Opacity fade in/out
- Wave: Shimmer effect left to right
- None: Static gray

---

## Specialized Components

### VerificationBadge

**Purpose**: Display verification and trust status

**Anatomy**:
```
[✓ Verified]  [🛡️ Health Tested]  [🏆 Champion]  [⭐ Top Rated]
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | 'verified' \| 'health' \| 'champion' \| 'topRated' | Yes | - | Badge type |
| size | 'sm' \| 'md' | No | 'md' | Badge size |
| showLabel | boolean | No | true | Show text label |
| tooltip | string | No | - | Custom tooltip text |

**Default Tooltips**:
| Type | Tooltip |
|------|---------|
| verified | "Identity and business verified" |
| health | "Health testing documentation on file" |
| champion | "Champion bloodline verified" |
| topRated | "4.5+ stars with 10+ reviews" |

---

### FilterPanel

**Purpose**: Search filters sidebar/bottom sheet

**Anatomy**:
```
┌─────────────────────────────────┐
│ Filters                 [Clear] │
├─────────────────────────────────┤
│ Category                        │
│ [Select category ▾]             │
│                                 │
│ Location                        │
│ [📍 City or ZIP] [Radius ▾]    │
│                                 │
│ Price Range                     │
│ [$Min] ────●──── [$Max]        │
│                                 │
│ Health Testing                  │
│ ☑ OFA Certified                │
│ ☐ DNA Tested                   │
│                                 │
│ [Apply Filters]                 │
└─────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| filters | FilterConfig[] | Yes | - | Filter definitions |
| values | Record<string, any> | Yes | - | Current filter values |
| onChange | function | Yes | - | Values change handler |
| onApply | function | No | - | Apply callback (mobile) |
| onClear | function | No | - | Clear all callback |
| loading | boolean | No | false | Loading state |
| resultCount | number | No | - | Show result count |

**FilterConfig**:
```typescript
interface FilterConfig {
  id: string;
  type: 'select' | 'multiselect' | 'range' | 'checkbox' | 'location';
  label: string;
  options?: Option[];
  min?: number;
  max?: number;
}
```

---

### SearchBar

**Purpose**: Global and contextual search input

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ [🔍] Search animals, breeders, services...        [×]  │
├─────────────────────────────────────────────────────────┤
│ Recent Searches                                         │
│ • German Shepherd puppies                              │
│ • Dog trainers near me                                 │
├─────────────────────────────────────────────────────────┤
│ Popular                                                 │
│ [Dogs] [Cats] [Training] [Grooming]                    │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | string | Yes | - | Search query |
| onChange | function | Yes | - | Query change handler |
| onSubmit | function | Yes | - | Search submit handler |
| placeholder | string | No | "Search..." | Placeholder text |
| suggestions | string[] | No | [] | Search suggestions |
| recentSearches | string[] | No | [] | Recent search history |
| quickFilters | QuickFilter[] | No | [] | Quick filter chips |
| loading | boolean | No | false | Loading state |
| autoFocus | boolean | No | false | Auto-focus on mount |

**QuickFilter**:
```typescript
interface QuickFilter {
  label: string;
  value: string;
  icon?: ReactNode;
}
```

---

### CategoryTile

**Purpose**: Visual category selection

**Anatomy**:
```
┌───────────┐
│    🐕     │
│   Dogs    │
│   2.3k    │
└───────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| icon | ReactNode | Yes | - | Category icon |
| label | string | Yes | - | Category name |
| count | number | No | - | Item count |
| selected | boolean | No | false | Selected state |
| onClick | function | No | - | Click handler |
| size | 'sm' \| 'md' \| 'lg' | No | 'md' | Tile size |

---

### ContactBox

**Purpose**: Contact/inquiry CTA section

**Anatomy**:
```
┌─────────────────────────────────────────────────────────┐
│ Interested in this listing?                             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │              Send Inquiry                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Response time: Usually within 24 hours                  │
│                                                         │
│ ⚠️ Never send payment outside of BreederHQ            │
└─────────────────────────────────────────────────────────┘
```

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| listingId | string | Yes | - | Listing ID for inquiry |
| listingTitle | string | Yes | - | Listing title |
| sellerName | string | Yes | - | Seller name |
| responseTime | string | No | - | Avg response time |
| onInquiry | function | Yes | - | Inquiry click handler |
| disabled | boolean | No | false | Disable inquiry |
| disabledReason | string | No | - | Why disabled |
| showSafetyTip | boolean | No | true | Show safety reminder |
```
