# SynOSX Menu v1.5 · Design Summary

> Status: **Active / Locked**
> Scope: Navigation & System Control Entry
> Evolution: v1 → v1.5 (Orb Introduction)

---

## 0. Change Log

* **v1**: Top-bar Menu as single entry (Desktop-first)
* **v1.5**: Introduce **Orb** as global system entry on Mobile

  * Menu panel architecture unchanged
  * Entry responsibility split: Desktop vs Mobile

---

## 1. Design Goal (Unchanged)

SynOSX Menu is **not a website navbar**, but a **system-level control console**.

Core responsibilities:

* Unified access to **Chapters / SynOS Layers / Cases / Whitepaper**
* Consistent behavior across Desktop & Mobile
* Clear separation of **Trigger** vs **Panel**

---

## 2. Structural Architecture

### 2.1 Responsibility Split (v1.5)

| Layer   | Component       | Responsibility                         |
| ------- | --------------- | -------------------------------------- |
| Entry   | **Orb**         | Global system trigger (Mobile primary) |
| Entry   | Top Menu Button | Desktop trigger                        |
| Panel   | sx-menu-panel   | Control console UI                     |
| Overlay | sx-menu-overlay | Focus isolation                        |
| Logic   | sx.menu.js      | Open / Close / Tabs                    |
| Visual  | sx.menu.css     | Panel layout                           |
| Visual  | sx.orb.css      | Orb appearance                         |

> **Key Rule**: Entry is NOT owned by Menu Panel

---

## 3. Desktop Behavior (Locked)

* Entry: Top-right Menu button
* Presentation: Floating panel below nav
* Interaction:

  * Click Menu → Panel open
  * Click overlay / X → Close

No changes from v1.

---

## 4. Mobile Behavior (Updated in v1.5)

### 4.1 Entry Change

* ❌ Deprecated: Top Menu button as primary entry
* ✅ New: **Orb (bottom-right, thumb zone)**

Rationale:

* One-hand usability
* High-frequency system access
* Reduced gesture distance

### 4.2 Panel Behavior (Unchanged)

* Bottom Sheet presentation
* Fixed header + scrollable content
* Internal overflow handling

---

## 5. Orb Design Principles

### 5.1 Role

Orb is a **system organ**, not decoration:

* Always available
* Low-frequency animation
* State-aware (Menu open / closed)

### 5.2 States

| State  | Description                    |
| ------ | ------------------------------ |
| Idle   | Static sphere                  |
| Pulse  | One-time feedback on Menu open |
| Active | Slow breathing while Menu open |

### 5.3 Interaction Rules

* Menu open → Orb visible, **not clickable**
* Orb never competes with panel interaction

---

## 6. Visual Philosophy

* Prefer **subtle life signs** over brightness
* Animation must survive long sessions
* No attention hijacking

> Design mantra: *"Not eye-catching, but alive."*

---

## 7. Non-Goals

* No auto-generated DOM
* No JS-driven visuals unless state-based
* No duplicated triggers

---

## 8. Locked Decisions

* Menu panel architecture remains
* Orb is the only mobile primary entry
* Entry and Panel must stay decoupled

---

## 9. Next Evolution (v2 Preview)

* Orb ↔ Seya state sync
* Context-aware pulse intensity
* Multi-panel system expansion

---

> SynOSX Menu v1.5 marks the transition from **navigation** to **system control**.
