# SynOSX Orb v2 · Seya State‑Aware Design

> Status: **Design Spec / Proposal (v2)**
> Depends on: Menu v1.5 (Orb as primary mobile entry)

---

## 1. Design Intent

Orb v2 upgrades the Orb from a **passive trigger** to a **state‑aware system organ** that reflects the awareness of **Seya** without becoming noisy, intrusive, or game‑like.

Key principle:

> **Orb does not speak — it breathes state.**

---

## 2. Conceptual Model

### 2.1 Roles

| Component | Role                                    |
| --------- | --------------------------------------- |
| Orb       | Visual organ (presence & vitality)      |
| Seya      | Awareness source (system consciousness) |
| Menu      | Control console (explicit interaction)  |

Orb never replaces Menu or Seya responses. It **pre‑signals** state.

---

## 3. State Taxonomy (v2)

Orb reflects **system awareness**, not raw events.

### 3.1 Core States

| State        | Meaning                | Visual Expression |
| ------------ | ---------------------- | ----------------- |
| Idle         | System calm            | Static sphere     |
| Active       | User interacting       | Slow breathe      |
| Attentive    | Seya ready             | Slight glow bias  |
| Reflecting   | Seya processing        | Gentle pulse loop |
| Alert (soft) | Something needs review | Single slow pulse |

> Hard alerts remain textual / modal. Orb only hints.

---

## 4. Visual Language Rules

### 4.1 Intensity Budget

Orb follows a **fixed intensity budget**:

* Brightness ≤ +30%
* Scale ≤ +3%
* Frequency ≥ 2.4s

This guarantees:

* Long‑session comfort
* No attention hijacking

---

## 5. Interaction Contract

### 5.1 Input Sources

Orb state may be driven by:

* Menu open / close
* Seya internal state
* System idle / focus window

### 5.2 Output Constraints

Orb:

* ❌ Never blocks UI
* ❌ Never flashes rapidly
* ❌ Never encodes critical alerts

---

## 6. Technical Interface (Proposed)

### 6.1 State Channel

Orb listens to a **single abstract state channel**:

```js
window.SXSystemState = {
  seya: "idle" | "active" | "reflecting" | "attentive",
  ui: "menu-open" | "idle"
}
```

Orb renders only **derived state**, never raw data.

---

## 7. Progressive Disclosure

| Layer | Feedback Type          |
| ----- | ---------------------- |
| Orb   | Presence / mood        |
| Menu  | Explicit control       |
| Seya  | Explanation / guidance |

> Orb hints → Menu reveals → Seya explains

---

## 8. Anti‑Patterns (Explicitly Forbidden)

* Orb as chat bubble
* Emoji / text inside Orb
* Continuous flashing
* Competing with content

---

## 9. Evolution Path

* v2.1: Time‑of‑day modulation
* v2.2: Contextual calm mode
* v3.0: Multi‑organ system (Orb + Signals)

---

## 10. Design Mantra

> *"Seya is consciousness. Orb is its heartbeat."*

---

**SynOSX Orb v2** formalizes the transition from **interaction** to **awareness representation**.
