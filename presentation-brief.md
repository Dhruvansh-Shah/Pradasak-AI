# Presentation Brief — Channel Finance Platform for SC Beneficiaries

Use this as the source content for the PPT. Section order roughly maps to slide order.

---

## 1. The Problem (for a "Problem Statement" slide)

The government provides concessional loans to Scheduled Caste beneficiaries (family income ≤ ₹5 Lakh) covering up to 90% of project/education costs at 6.5%–8% interest. But there's a catch: **you can't apply directly** — funds are routed through 100+ Channel Partners (State Channelizing Agencies, Public Sector Banks, Regional Rural Banks, NBFC-MFIs).

This creates three concrete pain points for a citizen:
1. **"Which scheme am I even eligible for?"** — Micro Finance Scheme (≤ ₹1.4L), Term Loan (≤ ₹50L), or Education Loan Scheme — most applicants don't know the difference.
2. **"What will I actually pay each month?"** — rates, caps, and moratorium periods vary by scheme (6.5%–15% interest, 3–12 month moratorium).
3. **"Which partner near me can even process this?"** — applicants can't tell which of the 100+ partners are eligible, nearby, or financially healthy enough (low NPA, fund availability) to act on their case.

**Result:** offline confusion, misrouted applications, delayed disbursement — for a scheme designed to be fast and concessional.

---

## 2. The Solution (one-line pitch)

A **chat-first, multilingual digital platform** where a citizen simply describes their situation in their own words — in any language — and an AI-driven pipeline recommends the right scheme, projects the real EMI, and shows the nearest eligible, financially healthy Channel Partner to contact.

---

## 3. How It Works — Three Core Engines

### Engine 1: Smart Scheme Recommender
- User types freely: *"I want to start a tailoring shop, family earns about ₹3 lakh a year."* — in any language.
- An LLM call converts this into a database query against the schemes catalog and retrieves matching schemes.
- A second, **grounded** LLM call explains the pros/cons of each match in plain language — using only the real scheme data retrieved (rate, cap, moratorium), never inventing numbers. Official figures are always shown straight from the database alongside the AI's explanation.
- The user can keep chatting with the AI to compare options before deciding.

### Engine 2: Financial Calculator
- Real EMI figures are computed with actual formulas in code (not guessed by AI) — accounting for each scheme's specific interest rate band, maximum loan limit, and moratorium period.
- An AI-guided conversation helps the user find a tenure/moratorium that fits their monthly budget, while every number shown is calculated, not generated.

### Engine 3: Geo-Spatial Partner Locator
- Once a scheme is chosen, the platform finds the nearest Channel Partners that are (a) eligible to process that scheme category, and (b) financially healthy — filtering out partners with high NPAs or exhausted fund utilization.
- Returns contact details and address for the citizen to follow up with directly.

### Cross-cutting: Financial Literacy & Accessibility
- Every recommendation comes with a plain-language explanation, not just a scheme name — building understanding, not just routing.
- Chat-first design means no language barrier: the same AI naturally responds in whichever language the user types in, and no separate translated UI screens are needed.

---

## 4. Why This Is Different (Unique Selling Points)

- **Grounded AI, not a black box.** Every number the platform shows (interest rate, loan cap, EMI) is sourced directly from the scheme database or computed by a real formula — the AI's job is explaining and conversing, never inventing figures. Important for a *financial* product judges will scrutinize for trustworthiness.
- **True multilingual support "for free."** No pre-translated UI strings to maintain — the conversational AI layer handles any language a user types in, including regional languages.
- **Solves the actual stated problem, not a generic loan app.** Directly targets the three named pain points: scheme confusion, EMI uncertainty, and partner misrouting — using the same "eligible + financially healthy partner" filter the problem statement explicitly calls for (avoiding high-NPA/overdue partners).

---

## 5. Tech Stack (for an "Architecture" slide)

| Layer | Choice |
|---|---|
| Frontend | Next.js (React), chat-first interface |
| Backend | Express.js |
| Database | PostgreSQL + PostGIS (one database for both scheme matching and geo-spatial partner search) |
| AI | OpenRouter (model-agnostic LLM access — classification, matching, and explanation calls) |

**Data flow (simple version for a diagram):**
`User free-text input → LLM (intent + query generation) → PostgreSQL (schemes / partners) → LLM (grounded explanation) → Chat UI response`

---

## 6. Impact (for an "Impact Goals" slide)

- **Financial literacy:** every interaction teaches the user *why* a scheme fits them, not just *that* it does.
- **Transparency & efficiency in the channel finance ecosystem:** citizens are routed only to partners who are actually eligible and have fund capacity — reducing misrouted applications and the delays they cause.

---

## 7. Current Scope Notes (for Q&A prep, not necessarily a slide)

- Partner NPA/fund-utilization data isn't publicly available in real time; the demo uses real data where it could be found, and clearly-labeled representative data elsewhere. This is a natural integration point for a live partner-status feed in a production rollout.
- The MVP surfaces the nearest eligible partner's **contact info** for the citizen to follow up with directly, rather than a full in-app application submission workflow — keeping the initial build focused on solving the discovery/routing problem first.
