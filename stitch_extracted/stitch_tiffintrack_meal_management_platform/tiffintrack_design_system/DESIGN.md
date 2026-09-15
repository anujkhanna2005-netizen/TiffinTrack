---
name: TiffinTrack Design System
colors:
  surface: '#fff8f4'
  surface-dim: '#e3d8ce'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf2e7'
  surface-container: '#f7ece2'
  surface-container-high: '#f1e6dc'
  surface-container-highest: '#ece1d7'
  on-surface: '#201b15'
  on-surface-variant: '#554339'
  inverse-surface: '#352f29'
  inverse-on-surface: '#faefe5'
  outline: '#897367'
  outline-variant: '#dcc1b4'
  surface-tint: '#9a4601'
  primary: '#9a4601'
  on-primary: '#ffffff'
  primary-container: '#e07b39'
  on-primary-container: '#4f2100'
  inverse-primary: '#ffb68c'
  secondary: '#186c37'
  on-secondary: '#ffffff'
  secondary-container: '#a0f2af'
  on-secondary-container: '#1e713b'
  tertiary: '#5d5d6f'
  on-tertiary: '#ffffff'
  tertiary-container: '#9594a8'
  on-tertiary-container: '#2d2d3e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68c'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#763400'
  secondary-fixed: '#a3f5b2'
  secondary-fixed-dim: '#87d898'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005225'
  tertiary-fixed: '#e3e0f7'
  tertiary-fixed-dim: '#c6c4da'
  on-tertiary-fixed: '#1a1a2a'
  on-tertiary-fixed-variant: '#464557'
  background: '#fff8f4'
  on-background: '#201b15'
  surface-variant: '#ece1d7'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '800'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.6rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.4rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.2rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes a high-velocity campus meal management platform where collegiate hospitality meets crisp administrative SaaS precision. The aesthetic balances the sensory warmth of home-style culinary delivery with the structured productivity expected of modern workflow tools.

The interface serves three distinct, interconnected user groups:
- **Students:** Seeking immediate clarity, frictionless meal customization, real-time dispatch tracking, and hassle-free wallet balance oversight during short breaks between lectures.
- **Mess & Kitchen Vendors:** Requiring high-density dispatch tables, quick-scan dietary breakdowns (veg/non-veg split, spice preference), batch fulfillment states, and dependable bulk operations.
- **Campus Administrators:** Auditing vendor compliance, managing delivery hub access points, tracking meal plan subsidies, and querying system logs.

The design movement is a purposeful synthesis of **Modern Food-Tech** (dynamic status affordances, rich meal imagery cues, approachable warmth) and **Productivity SaaS** (tight typographical scales, micro-badges, compact data tables, monospaced code-like data attributes). The overall feeling is warm, reliable, appetite-stimulating, and scrupulously structured.

## Colors

The color system delivers high appetite appeal alongside crisp, unambiguous operational states:

- **Primary Saffron (`#E07B39`):** Represents warmth, aromatic spices, and energy. Used for primary calls-to-action, key navigation highlights, active meal selection indicators, and brand-level anchor points. Deepened to `#C4612A` for high-contrast active states and borders.
- **Secondary Herb Green (`#2D7D46`):** Grounded botanical tone used for pure-veg meal indicators, active subscription confirmations, on-time delivery statuses, and positive wallet increments.
- **Tertiary Cyber Navy (`#1E1E2E`):** A deep, focused dark tone reserved for developer showcase panels, database schema popovers, SQL query previews, and campus terminal monitoring.
- **Neutral Dark (`#1F1A14`):** An espresso charcoal base applied across high-priority typography, high-contrast borders, and primary icon glyphs to maintain stark contrast against light backgrounds.
- **Neutral Muted (`#7A6E60`):** Warm slate for secondary metadata, column headers, helper labels, and subtle dividing lines.
- **Surfaces & Canvases:**
  - App Canvas: `#F7F4F0` (warm off-white that reduces glare in direct campus daylight).
  - Surface Default: `#FFFFFF` (pure white for elevated cards, order tiles, and operational surfaces).
  - Subtle Borders: `#E5DFD7` (warm grey stroke maintaining containment without harshness).
- **Semantic Feedback:**
  - Success: `#10B981` (active delivery, confirmed payment).
  - Warning: `#F59E0B` (expiring token, cutoff time warning).
  - Destructive / Error: `#D93025` (missed cutoff, canceled meal, out of stock).
  - Info: `#2563EB` (campus announcements, hub re-routing alerts).

## Typography

The typographic hierarchy couples **Plus Jakarta Sans** for expressive, optimistic headlines with **Inter** for dense, legible operational flows.

- **Headlines & Display:** Set in Plus Jakarta Sans with compact letter spacing (`-0.015em` to `-0.03em`) and confident weights (`600` to `800`). Gives menus, vendor names, and marketing banners an inviting, contemporary rhythm.
- **Body & Data Grid:** Rendered in Inter to maximize legibility across order IDs, dietary notes, schedule timelines, and ingredient manifests.
- **Micro-Badges & Status Labels:** Set in Inter (`600` or `700`) with uppercase transformations on `label-xs` for status indicators (e.g., `PREPARING`, `DISPATCHED`, `PURE VEG`). Numbers within tables and subscription credit counters should employ tabular figures (`tnum`) to eliminate layout jitter during real-time sync.

## Layout & Spacing

The system enforces an 8pt spatial grid with half-step increments (`0.25rem` / `4px`) for compact UI accessories like badge padding, status dots, and inline action clusters.

- **Desktop (1024px+):** Employs a 12-column layout with `1.5rem` (`24px`) gutters and `2rem` (`32px`) margins. Kitchen dispatch queues and admin audit feeds expand up to `1440px` max-width.
- **Tablet (768px - 1023px):** Adapts to an 8-column layout. Sidebars collapse to icon-only rails or bottom tabs; card grids collapse to 2 columns.
- **Mobile (< 768px):** Drops to a 4-column layout with `1rem` (`16px`) margins and gutters. Meal selection carousels switch to full-width card snaps. Crucial ordering controls stick to the bottom viewport with a persistent 80px safe touch zone.
- **Vertical Rhythm:** Content cards standardize on internal padding of `space-md` (`16px`) for compact vendor views, and `space-lg` (`24px`) for consumer meal details.

## Elevation & Depth

Visual depth combines warm low-contrast borders with soft, warm-tinted ambient drop shadows. Surfaces reflect a natural daylight environment rather than cold digital gray.

- **Level 0 (Base Canvas):** `#F7F4F0`. Flat canvas ground upon which operational modules sit.
- **Level 1 (Card & Module Default):** `#FFFFFF` surface with a `1px` structural outline (`#E5DFD7`) and an ambient shadow: `0px 2px 4px rgba(31, 26, 20, 0.04), 0px 1px 2px rgba(31, 26, 20, 0.02)`.
- **Level 2 (Active Order / Interactive Hover):** `#FFFFFF` surface, outline `#D8D1C7`, with elevated ambient shadow: `0px 8px 20px rgba(31, 26, 20, 0.08), 0px 2px 6px rgba(31, 26, 20, 0.04)`.
- **Level 3 (Modals, Slide-over Drawers, Floating Cart):** Elevates above interactive canvas using `0px 16px 36px rgba(31, 26, 20, 0.12), 0px 4px 12px rgba(31, 26, 20, 0.06)` paired with a soft backdrop scrim: `rgba(31, 26, 20, 0.45)` with `4px` blur.
- **Technical Surface Layer (Cyber Navy):** Background `#1E1E2E` with inner stroke `rgba(255, 255, 255, 0.08)` and subtle interior glow for database views and payload monitors.

## Shapes

The design uses roundedness level `2`:
- **Standard Controls & Elements (`rounded`):** `0.5rem` (`8px`) for text fields, buttons, table cell selections, and dropdown menus.
- **Cards, Meal Tiles, and Drawers (`rounded-lg`):** `1rem` (`16px`) for primary order cards, subscription plan surfaces, and kitchen summary blocks.
- **Large Panels & Modals (`rounded-xl`):** `1.5rem` (`24px`) for hero banners, modal dialogs, and checkout sheets.
- **Full Radius (`rounded-full`):** Reserved exclusively for status badges, tags, meal tags (e.g., Pure Veg, Jain, High Protein), avatar frames, and circular floating action triggers.

## Components

### Buttons
- **Primary:** Background `#E07B39`, text `#FFFFFF`, border none, radius `8px`. Hover: `#C4612A`. Active: transform scale `0.98`. Focus ring: `3px` offset ring in `rgba(224, 123, 57, 0.35)`.
- **Secondary / Ghost:** White background, border `1px` solid `#E5DFD7`, text `#1F1A14`. Hover: background `#F7F4F0`, border `#D8D1C7`.
- **Success Action (Confirm Meal Delivery):** Background `#2D7D46`, text `#FFFFFF`. Hover: `#246638`.
- **Destructive:** Background `#FFF1F0`, text `#D93025`, border `1px` solid `rgba(217, 48, 37, 0.2)`.

### Chips & Micro-Badges
- Always rendered with `rounded-full` shape.
- **Pure Veg Indicator:** White background, `1px` border `#2D7D46`, inner green circular dot with text `#2D7D46`.
- **Delivery Status Chips:**
  - *Order Placed:* Light saffron background (`#FDF3EB`), text `#C4612A`.
  - *In Kitchen:* Amber tint (`#FEF3C7`), text `#B45309`.
  - *Out for Delivery:* Herb green tint (`#E8F5E9`), text `#2D7D46`.
  - *Paused / Skipped:* Warm grey tint (`#F0EDE8`), text `#7A6E60`.

### Form Inputs & Selectors
- **Input Fields:** Base height `42px`, background `#FFFFFF`, border `1px` solid `#E5DFD7`, radius `8px`, font Inter `0.875rem`, text `#1F1A14`.
- **Focus State:** Border `#E07B39`, box shadow `0 0 0 3px rgba(224, 123, 57, 0.2)`.
- **Helper & Error Text:** Error displays in Coral Red `#D93025` with an alert icon; helper text in Warm Slate `#7A6E60`.

### Checkboxes & Radios
- Rounded `4px` for checkboxes, `rounded-full` for radios.
- Inactive: `1.5px` border `#D8D1C7`, background `#FFFFFF`.
- Active: Background `#E07B39` with white checkmark glyph.

### Cards & Meal Containers
- Background `#FFFFFF`, border `1px` solid `#E5DFD7`, radius `16px`.
- Divided inside using thin horizontal lines (`1px` `#F2ECE4`).
- Meal header includes thumbnail, subscription tag, countdown timer pill for cancellation cutoff, and price/credit breakdown.

### Kitchen Dispatch Table (Vendor Specific)
- Dense layout with row height `48px`. Alternate row fills: `#FFFFFF` and `#FAFAF8`.
- Monospaced token code (e.g., `#TIF-8841`) in high-contrast espresso font.
- Direct switch toggle for instant fulfillment confirmation without page navigation.