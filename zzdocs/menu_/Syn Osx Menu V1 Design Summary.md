# SynOSX Menu v1 · Design Summary

> Version: **v1.0 (Lock-in Candidate)**
> Scope: **Navigation Menu (Desktop + Mobile)**
> Status: **Interaction & Structure Stable**

---

## 1. Design Goal

SynOSX Menu is **not a page component**, but a **system-level control console**.

Its purpose is:

* Provide a **stable, brand-consistent system entry**
* Support **desktop precision** and **mobile single-hand operation**
* Maintain a clear **"system boundary"** separate from page content

Core principle:

> **Menu is an entry point, not a content container.**

---

## 2. Overall Architecture

### Layers

```
Trigger (Multiple)
 ├─ Desktop Topbar Menu Button
 └─ Mobile Floating FAB ("SynOSX")
        ↓
Overlay (Global)
        ↓
Menu Panel (Console)
 ├─ Header (fixed)
 ├─ Tabs (views)
 └─ Content Area (scrollable)
```

### Key Rules

* **One menu state, multiple triggers**
* **Only one scroll owner** (content area)
* **Panel size is constrained** (never full-screen)

---

## 3. Desktop Design

### Trigger

* Location: **Top-right navigation bar**
* Style: Secondary button (`btn-secondary`)
* Behavior: Toggle open / close

### Panel

* Position: Anchored below navigation bar
* Width: ~280–360px (system console scale)
* Height: `max-height` constrained
* Visual:

  * Rounded corners
  * Border + shadow
  * Detached from page background

**Design Intent:**

> Looks and behaves like an OS popover, not a dropdown menu.

---

## 4. Mobile Design

### Primary Entry (FAB)

* Type: Floating Action Button
* Label: **"SynOSX"** (brand-first, not icon-only)
* Position: Bottom-right
* Reason:

  * Single-hand reachability
  * Clear system entry identity

### Secondary Entry

* Topbar Menu button still exists
* Shares same trigger logic

---

## 5. Mobile Panel (Bottom Console)

### Layout

* Form: **Bottom-floating console** (not full-width drawer)
* Insets:

  * Left / Right: small margins
  * Bottom: slight elevation (not glued)

### Visual Boundary

* Full rounded corners
* Visible border
* Strong shadow separation

**Why not full-width, no-border?**

Because:

> SynOSX Menu represents **system governance boundary**, not page UI.

---

## 6. Tabs System

### Structure

* Horizontal tabs (flex-based, content-width)
* Typical views:

  * Chapters
  * SynOSX
  * Cases
  * Whitepaper

### Interaction

* Active tab uses **slider capsule**
* Slider auto-resizes to tab content
* Keyboard and pointer supported

---

## 7. Content & Scrolling Strategy

### Final Rule (Critical)

> **Only one element owns scrolling.**

### Implementation

* Scroll owner: `.sx-menu-content`
* Lists (`.sx-menu-list`) do **not** manage height or overflow

### Result

* No iOS rubber-band bounce
* No "drag only / release snap-back" issue
* Natural momentum scrolling

---

## 8. Scroll Hint (Affordance)

* Bottom gradient fade inside content area
* Indicates more content below without text or icons

**Principle:**

> Scroll is capability; fade is cognitive courtesy.

---

## 9. JavaScript Design

### Trigger Handling

* Supports **multiple `[data-sx-menu="trigger"]` elements**
* All triggers share:

  * Same open / close state
  * Synced `aria-expanded`

### State

```js
state = {
  open: boolean,
  activeTab: string
}
```

### Accessibility

* `aria-hidden` on panel
* `aria-expanded` on triggers
* ESC closes menu (desktop)

---

## 10. What v1 Explicitly Does NOT Do

* ❌ Full-screen takeover
* ❌ Nested accordion navigation
* ❌ Pagination inside menu
* ❌ Content compression to "fit everything"

These are intentionally excluded to preserve:

* Focus
* System feel
* Long-term scalability

---

## 11. v1 Lock-in Statement

This version establishes:

* Stable interaction model
* Clear system vs page boundary
* Mobile-first but desktop-consistent behavior

> **SynOSX Menu v1 is considered structurally complete.**

Future versions may extend content or intelligence,
**but should not break this interaction contract.**

---

## 12. Version Tag

```
SynOSX Menu
v1.0 — System Console Navigation
```
