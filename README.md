# Pradarshak AI (प्रदर्शक AI)

**Smart India Hackathon 2026 — Problem Statement ID 26092**
AI-Driven Scheme Matching for Marginalized Entrepreneurs · Theme: FinTech · Category: Software

A multilingual, chat-first platform that guides Scheduled Caste (SC) beneficiaries from a natural-language loan query to scheme discovery, financial planning, and verified channel-partner access.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-purple?style=flat-square)](https://openrouter.ai/)

---

## The Problem

Government channel finance schemes offer concessional loans to SC beneficiaries (annual family income ≤ ₹5 Lakh), covering up to 90–95% of project or education costs at subsidized rates (6.5–8%). Beneficiaries can't apply directly at the central level — every application is routed through 100+ Channel Partners (State Channelizing Agencies, Public Sector Banks, Regional Rural Banks, and NBFC-MFIs). That routing creates three recurring problems:

1. **Scheme discovery is confusing.** Applicants struggle to tell whether they qualify for Micro Finance (≤ ₹1.4L), Mahila Samriddhi, Term Loans (≤ ₹50L), or Education Loans.
2. **EMI and moratorium math is opaque.** First-time borrowers can't easily work out monthly commitments across different interest brackets, caps, and 3–12 month moratorium periods.
3. **Partner routing is a guessing game.** Beneficiaries can't tell which nearby partner handles their scheme category or which ones actually have funds available and healthy NPAs.

**Pradarshak AI** addresses all three with a single chat-first, multilingual interface that pairs a grounded LLM with deterministic financial computation and geospatial search — recommending the right scheme, computing a real EMI, and pointing the user to the nearest healthy channel partner.

---

## How It Works

The conversational flow is built around four steps:

1. **Tell us your need** — the user describes their situation in plain language (e.g. *"I want to set up a tailoring unit in Jaipur, family income ₹3 Lakh"*).
2. **Understand your profile** — the system builds a profile from what's said (location, income, purpose) and asks natural follow-up questions for anything missing.
3. **Match the right scheme** — eligible schemes are ranked and shortlisted, with EMI and affordability calculated deterministically in code, never guessed by the LLM.
4. **Find a verified partner** — nearby channel partners are checked against fund availability and NPA health before being recommended.

### Architecture

![Pradarshak AI system architecture](docs/architecture.svg)

The **Intent Router** dispatches each conversational turn to the relevant backend service (scheme matching, EMI calculation, or partner lookup) based on intent and entities extracted upstream by the NLU layer. Every service does its real work — database lookups, financial math, spatial queries — in deterministic code; the LLM's role is confined to understanding the user and explaining verified results back to them.

---

## Key Features

### 1. Grounded AI Scheme Recommender
- Natural-language interaction — users speak or type queries conversationally.
- Intent + entity extraction routes each turn to the right backend service; the LLM never fabricates numbers, it explains results pulled from the database.
- Conversational memory (user profile, idea context, chat history) persists across turns so the system doesn't re-ask what it already knows.
- Multilingual support across English, Hindi, and regional languages.

### 2. Precision Financial & EMI Calculator
- Interest rates, subsidies, and EMI schedules are computed with real financial formulas in code — never estimated by the LLM.
- Moratorium-aware: handles 3–12 month grace periods where interest can accrue or be deferred.
- Interactive sliders for loan amount, tenure, and down payment, with visual amortisation breakdowns.

### 3. Geo-Spatial Channel Partner Locator
- PostGIS spatial search (`ST_DWithin` / `ST_Distance`) finds active partners within the applicant's radius.
- Filters out partners with high NPAs or exhausted fund allocations.
- Interactive map (Leaflet + OpenStreetMap) showing partner addresses, eligible categories, and contact details.

### 4. Document & Eligibility Checklist
- Auto-generates the required documentation list (Caste Certificate, Income Certificate, Project Report, Quotations).
- Step-by-step guidance on submitting documents to the identified partner.

### 5. Admin & Verification Dashboard
- Oversight portal for schemes, partner fund allocations, and applicant verification queues.
- Real-time management of partner status and scheme parameters.

---

## Why It Matters

| | |
|---|---|
| **For citizens** | Reduces confusion and information gaps — access to relevant schemes with more clarity and confidence. |
| **For the ecosystem** | Connects citizens, government schemes, financial services, and verified partners through one discovery and guidance layer. |
| **For the future** | A scalable, multilingual approach that can expand across regions and scheme categories. |

**Key differentiators over the conventional approach:**

| Capability | Conventional approach | Pradarshak AI |
|---|---|---|
| Scheme discovery | Manual search | Personalized match |
| Eligibility check | Manual check | Profile-based |
| Scheme comparison | Scattered info | Ranked schemes |
| Financial planning | Separate calculation | EMI + affordability, combined |
| Partner discovery | Local / intermediary-dependent | Location-aware |
| Language access | Limited | Multilingual chat + voice |
| Application guidance | Self-guided | Guided next steps |
| Information source | Scattered sources | Grounded, verified data |
| Financial calculations | Manual estimates | Deterministic engine |
| Updates & monitoring | Fragmented | Centralized |

---

## Feasibility & Viability

**Feasibility**
- *Technical:* Proven stack — LLM, PostgreSQL, REST APIs, modular backend services.
- *Innovation:* Context-aware AI combining intent detection, entity extraction, and memory for personalized responses.
- *Operational:* Modular routing — Scheme, EMI, and Partner requests are each handled independently.
- *Economic:* Built on existing cloud infrastructure and open-source technology, keeping setup costs low.

**Viability**
- *Market:* Growing demand for AI-driven financial assistance and accessible scheme discovery.
- *Revenue:* Potential partnerships with financial institutions, government programs, and service providers.
- *Investment & ROI:* Low infrastructure cost with strong long-term returns.
- *Scalability:* Easily extends to new schemes, financial services, and partners.

**Risks & mitigations**

| Risk | Mitigation |
|---|---|
| LLM may provide inaccurate financial guidance | Verified scheme/partner data, deterministic backend calculations, and validation checks |
| Users may hesitate to trust AI with financial decisions or personal data | Transparent responses, verified information, minimal unnecessary data collection |
| Real-time NPA / partner-fund data may be limited | Clearly labelled prototype values, planned integration with live sources |
| Scheme rates and eligibility rules may change | Centralized, admin-managed updates to schemes and partner data |

---

## Tech Stack

**Frontend**
- Next.js 16.3 (App Router), React 19
- Tailwind CSS v4 + a custom design system
- Lucide React icons
- Leaflet & React-Leaflet for mapping
- React Hooks + Local Storage for session state

**Backend**
- Node.js + TypeScript, Express.js 5
- PostgreSQL with PostGIS (Neon or local)
- `pg` with connection pooling
- OpenRouter API — Gemini 1.5 Flash for query/intent processing, Claude 3.5 Haiku for grounded explanations
- JWT + `bcryptjs` for auth, CORS middleware

---

## Repository Structure

```
.
├── backend/                     # Express.js REST API & database layer
│   ├── src/
│   │   ├── admin-static/        # Embedded static admin portal
│   │   ├── db/                  # Connection pool, schema, seed data, migrations
│   │   ├── middleware/          # Auth & validation
│   │   ├── routes/              # chat, recommend, emi, partners, userAuth, admin
│   │   ├── services/            # ChatOrchestrator, IntentClassifier, SchemeEngine, LocationService
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/                    # Next.js 16 App Router UI
│   ├── app/                     # page, chat, schemes, partners, admin, auth
│   ├── components/              # ChatInterface, EmiCalculator, PartnerLocator, SchemeCard, Map, NavBar, Footer
│   ├── .env.local.example
│   └── package.json
│
├── presentation-brief.md
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm / yarn / pnpm
- PostgreSQL with the `postgis` extension (Neon, Supabase, or local)
- An [OpenRouter API key](https://openrouter.ai/keys)

### 1. Clone

```bash
git clone https://github.com/arnav-2205/Pradasak-AI.git
cd Pradasak-AI
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
DATABASE_READONLY_URL=postgresql://sih_readonly:password@host.neon.tech/neondb?sslmode=require

OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
OPENROUTER_STRONG_MODEL=anthropic/claude-3-5-haiku

PORT=4000
ADMIN_PORT=3001
```

```bash
npm run db:migrate
npm run db:migrate-v2
npm run dev
```

API runs at `http://localhost:4000`, admin panel at `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Main conversational AI orchestration endpoint |
| `POST` | `/api/recommend` | Filters and ranks schemes based on applicant criteria |
| `POST` | `/api/emi/calculate` | Calculates EMI, interest, and moratorium schedule |
| `GET` | `/api/schemes` | Returns the active concessional schemes catalog |
| `GET` | `/api/partners/nearby` | Geo-spatial lookup of healthy channel partners (`?lat=...&lng=...&category=...`) |
| `POST` | `/api/users/register` | Beneficiary registration |
| `POST` | `/api/users/login` | Beneficiary authentication |
| `GET` | `/api/admin/metrics` | System-wide partner metrics and application volume |
| `GET` | `/api/health` | Service health check |

---

## Security

- No database credentials or LLM API keys are exposed to the client — all queries go through the backend.
- Conversational SQL generation runs on a restricted read-only database role (`sih_readonly`).
- System prompts require that all numerical claims (rates, caps, subsidy percentages) match verified database records verbatim.

---

## Research & References

**Domain & official sources**
- [NSFDC](https://nsfdc.nic.in/) — scheme eligibility, loan limits, and interest rates
- Ministry of Social Justice & Empowerment — financial inclusion framework

**Technical references**
- PostgreSQL + PostGIS — database and geospatial routing
- OpenStreetMap — map data and location visualization
- OpenRouter — LLM access for conversational AI
- BHASHINI — Indian-language translation and speech
- Neon — serverless PostgreSQL hosting

## Future Scope

| # | Direction | Detail |
|---|---|---|
| 1 | Real-time partner status | Integrate live fund availability, NPA, and operational status updates |
| 2 | End-to-end application | Enable digital application submission and document verification |
| 3 | Continuous scheme updates | Automate updates for rates, rules, and eligibility criteria |
| 4 | Advanced financial planning | Repayment scenarios, affordability analysis, personalized planning |
| 5 | Production deployment | Strengthen security, monitoring, and scalable infrastructure |

---

## Team

Developed for the **Smart India Hackathon (SIH) 2026** — Team Pradarsak.

**Repository:** [arnav-2205/Pradasak-AI](https://github.com/arnav-2205/Pradasak-AI)

## License

Licensed under the [ISC License](LICENSE).
