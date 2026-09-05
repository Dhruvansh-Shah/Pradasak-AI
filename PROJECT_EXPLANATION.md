# Comprehensive Project Guide: Pradarshak AI (प्रदर्शक AI)

**Smart India Hackathon 2026 — Problem Statement ID: 26092**  
**Theme:** FinTech · **Category:** Software  
**Target Audience:** Scheduled Caste (SC) Beneficiaries (Annual Family Income ≤ ₹5.00 Lakh)  
**Core Mission:** AI-Driven Scheme Matching, Deterministic Financial Planning, and Geo-Spatial Channel Partner Discovery.

---

## 1. Executive Summary & Overview

**Pradarshak AI (प्रदर्शक AI)** is an intelligent, multilingual, chat-first digital platform created to bridge the information, financial, and access barriers facing Scheduled Caste (SC) beneficiaries in India. 

The Government of India, through the **National Scheduled Castes Finance and Development Corporation (NSFDC)** under the Ministry of Social Justice and Empowerment, provides concessional loan schemes at low interest rates (4.0% – 8.0%) covering up to 90–95% of project or education costs. However, applicants cannot apply directly at the central level; every loan is disbursed through 100+ **Channel Partners** (State Channelizing Agencies - SCAs, Public Sector Banks - PSBs, Regional Rural Banks - RRBs, and NBFC-MFIs).

This indirect routing creates massive friction, information asymmetry, and application delays. **Pradarshak AI** solves this problem end-to-end by providing:
1. **Natural Language Scheme Discovery:** Citizens describe their situation in plain language (voice or text in English, Hindi, or Marathi), and the system matches them with eligible NSFDC schemes.
2. **Grounded & Deterministic AI:** The Large Language Model (LLM) is strictly restricted to conversational explanation and entity extraction; all financial calculations, interest rates, loan caps, moratorium periods, and spatial distances are computed deterministically by database scoring algorithms and standard financial formulas.
3. **Geo-Spatial Partner Search:** Using PostGIS spatial indexing, the platform routes applicants to nearby authorized channel partners who are active, have available fund allocations, and maintain healthy Non-Performing Asset (NPA) ratios.

---

## 2. The Problem Landscape & Domain Context

Government channel finance schemes offer transformative capital for micro-enterprises, small trades, agricultural ventures, and higher education. However, beneficiaries face four critical systemic challenges:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        4 Core Citizen Pain Points                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 1. Scheme Confusion      │ Applicants struggle to differentiate between│
│                          │ Micro Finance (≤ ₹1.4L), Term Loans (≤ ₹50L)│
│                          │ Mahila Samriddhi, Swachhta Udyami, etc.     │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 2. Opaque Financial Math │ Interest rates, tenure caps, and moratorium │
│                          │ (3–12 month grace period) math is hard to   │
│                          │ calculate for first-time borrowers.         │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 3. Partner Misrouting    │ Citizens don't know which local bank branch │
│                          │ handles their scheme category or has funds.  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 4. Language & Complexity │ Technical banking jargon and multi-step     │
│    Barriers              │ forms deter low-literacy applicants.        │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 3. End-to-End User Workflow & Journey

The user interaction model is designed to be frictionless, conversational, and multi-turn. Here is the step-by-step user journey:

```
  [1. User Input] ──► Speech/Text in English, Hindi, or Marathi
         │
  [2. Intent & Tool] ──► ChatOrchestrator invokes real backend tool
         │
  [3. DB & Math] ──► SQL scoring / PostGIS search / EMI formula execution
         │
  [4. Grounded Output] ──► Conversational summary + Rich interactive UI card
         │
  [5. Actionable Steps] ─► Quick action buttons (Calculate EMI, Find Partner, Documents)
```

### Step-by-Step Breakdown:

1. **Step 1: Expressing Needs (Natural Language or Speech)**
   - The user opens the web app and types or speaks via microphone:  
     *"I want to set up a tailoring unit in Jaipur, family income ₹2.5 Lakh."*
2. **Step 2: Intelligent Profile Building & Grounded Tool Call**
   - The `ChatOrchestrator` parses the prompt, extracts entities (`purpose: tailoring`, `location: Jaipur`, `family_income: 250000`), and invokes the `recommend_schemes` tool.
   - If critical information is missing (e.g., location when asking for a partner), the assistant asks a single, warm follow-up question.
3. **Step 3: Deterministic Scheme Matching & Ranking**
   - `SchemeEngine.ts` queries the `schemes` table and calculates a multi-criteria score based on income limits, loan ceilings, project type matching, and gender constraints.
   - The UI presents a **Scheme Result Card** highlighting recommended schemes (e.g., *Mahila Samriddhi Yojana* or *Micro Credit Finance*) with match reasons and warnings.
4. **Step 4: EMI & Moratorium Calculation**
   - The user clicks **"Calculate EMI"** or asks *"What will my monthly payment be for ₹1 Lakh?"*.
   - The backend runs a deterministic compound interest algorithm accounting for moratorium grace periods (3–12 months).
   - An interactive **EMI Result Card** displays monthly EMI, total interest, total payable, and amortization breakdown with real-time sliders for amount and tenure.
5. **Step 5: Location-Aware Channel Partner Discovery**
   - The user asks *"Where can I apply near me in Jaipur?"*.
   - The backend geocodes Jaipur (`26.9124, 75.7873`) and runs a PostGIS `ST_DWithin` query against the `partners` table.
   - It filters for healthy partners (`npa_percent < threshold`, `fund_utilization_percent < 85%`) and returns a **Partner Result Card** and an interactive **Leaflet Map** with branch addresses, distance in kilometers, phone numbers, and direct contact details.
6. **Step 6: Document Checklist & Guidance**
   - The user asks *"What documents do I need to take to the bank?"*.
   - The system returns a tailored checklist (Aadhaar, Caste Certificate, Income Certificate, Quotation/Project Report, Passbook).

---

## 4. Technical System Architecture

The application is structured as a decoupled, full-stack architecture with a Next.js frontend, an Express.js API gateway, a PostgreSQL + PostGIS relational database, and an OpenRouter AI integration layer.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│    Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Leaflet      │
│  • ChatInterface, SchemeCard, EMIResultCard, PartnerCard, Map, Speech │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST / JSON API
┌───────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND API GATEWAY                            │
│                 Express.js 5 + TypeScript + JWT Auth                   │
├────────────────────────────────────────────────────────────────────────┤
│  • Chat Orchestrator (Single-turn agentic loop)                        │
│  • Scheme Engine (Multi-criteria scoring & semantic matching)          │
│  • Location Service (Geocoding + PostGIS spatial search)               │
│  • Financial Math Engine (Moratorium-aware EMI formula)                │
└─────────────────┬──────────────────────────────────────┬───────────────┘
                  │                                      │
       SQL Queries│                                  LLM │ Calls
┌─────────────────▼────────┐                ┌────────────▼──────────────┐
│  PostgreSQL + PostGIS    │                │      OpenRouter API       │
│  • schemes catalog       │                │  • Google Gemini Flash    │
│  • partners (spatial)    │                │  • Claude 3.5 Haiku       │
│  • users & chat logs     │                │  • Tool calling & grounding│
└──────────────────────────┘                └───────────────────────────┘
```

---

## 5. Deep Dive into Core Backend Services

### 1. `ChatOrchestrator.ts` — Single-Turn Agentic Loop
Unlike traditional chatbots that use rigid keyword rules or multi-step prompt chains, `ChatOrchestrator` runs a **single agentic tool-calling loop**:
- The model is supplied with tool definitions (`recommend_schemes`, `calculate_emi`, `find_partners`, `get_required_documents`, `compare_schemes`).
- The model reads conversation history and decides whether to ask a clarifying question or call a tool.
- When a tool is executed, raw database/mathematical output is injected back into the LLM context.
- The LLM synthesizes a warm, plain-text response grounded *strictly* in the tool output.
- **Markdown Safety Net (`stripMarkdown`):** Strips markdown headers, bullet symbols, and table pipes before returning responses, ensuring clean plain-text rendering in the chat UI.

### 2. `SchemeEngine.ts` — Deterministic Scheme Matching
The scheme matching engine scores catalog schemes against user attributes:
- **Semantic Project Grouping:** Maps multilingual keywords (e.g., English *"tailoring"*, Hindi *"सिलाई"*, Marathi *"शिलाई"*) to scheme category buckets.
- **Scoring Logic:**
  - **Purpose Match:** Up to +100 points for acronym/name/category match.
  - **Income Verification:** Penalizes applicants whose income exceeds the maximum threshold (₹5.00 Lakh/year).
  - **Loan Ceiling:** Penalizes requests exceeding the max scheme loan limit.
  - **Gender Safeguard:** Strictly penalizes non-female or unspecified applicants for women-only schemes (e.g., *Mahila Samriddhi Yojana* score -300), preventing mis-recommendations.

### 3. `LocationService.ts` — PostGIS Spatial Partner Search
- **Geocoding Pipeline:** Looks up locations in an in-memory dictionary of major Indian cities (`CITY_COORDS`). If not found, falls back to OpenStreetMap Nominatim API.
- **Spatial Querying:** Executes PostGIS geography queries using `ST_DWithin` and `ST_Distance`:
  ```sql
  SELECT id, name, partner_type, address, city, state, phone, email,
         eligible_categories, fund_availability_status, npa_percent,
         ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km
  FROM partners
  WHERE is_active = TRUE
    AND ($2::text IS NULL OR $2 = ANY(eligible_categories))
    AND ST_DWithin(location, ST_GeographyFromText($1), $3)
  ORDER BY distance_km ASC LIMIT $4;
  ```

### 4. `Tools.ts` — Financial & EMI Calculation Engine
The EMI calculator handles moratorium (grace) periods where interest accrues before principal repayment starts:
$$\text{Effective Principal } P' = P \times \left(1 + \frac{r}{12}\right)^m$$
Where $P$ is principal, $r$ is annual interest rate, and $m$ is moratorium months.

Standard EMI is then computed as:
$$\text{EMI} = \frac{P' \times r_m \times (1 + r_m)^n}{(1 + r_m)^n - 1}$$
Where $r_m = \frac{r}{12}$ and $n$ is tenure in months.

---

## 6. Database Schema & Data Models

The PostgreSQL database utilizes the `postgis` spatial extension.

```
┌──────────────────┐       ┌──────────────────┐
│     schemes      │       │     partners     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ name             │       │ name             │
│ short_name       │       │ partner_type     │
│ category         │       │ location (Geog)  │
│ min/max_income   │       │ eligible_categs  │
│ min/max_loan     │       │ npa_percent      │
│ interest_rates   │       │ fund_status      │
│ moratorium_mths  │       └──────────────────┘
│ gender_eligib    │
│ documents        │       ┌──────────────────┐       ┌──────────────────┐
└──────────────────┘       │      users       │       │      chats       │
                           ├──────────────────┤       ├──────────────────┤
                           │ id (PK)          │       │ id (PK)          │
                           │ name, email      │◄──────┤ user_id (FK)     │
                           │ password_hash    │       │ title            │
                           └──────────────────┘       └────────┬─────────┘
                                                               │
                                                      ┌────────▼─────────┐
                                                      │  chat_messages   │
                                                      ├──────────────────┤
                                                      │ id (PK)          │
                                                      │ chat_id (FK)     │
                                                      │ role, content    │
                                                      │ type, data (JSON)│
                                                      └──────────────────┘
```

---

## 7. Key Differentiators & Innovation

| Feature / Capability | Standard Loan Portals | Pradarshak AI |
|---|---|---|
| **Discovery Mechanism** | Static drop-downs & manual filters | Natural language chat (Voice/Text, Multilingual) |
| **Financial Calculations** | Estimates or static tables | Moratorium-aware deterministic math engine |
| **Partner Routing** | Unfiltered branch list | Geo-spatial PostGIS search filtered by NPA & fund health |
| **AI Reliability** | Hallucination prone | Grounded tool calling (AI never invents rates or numbers) |
| **Target Focus** | Generic banking | Tailored specifically for SC beneficiaries (NSFDC guidelines) |

---

## 8. Directory & Repository Map

```
PradarsakAI/
├── backend/
│   ├── src/
│   │   ├── db/                 # Pool configuration, migrations (v1, v2, v3), seed scripts
│   │   ├── lib/                # OpenRouter API client wrapper
│   │   ├── middleware/         # JWT User Authentication & Validation middleware
│   │   ├── routes/             # API Endpoints (/chat, /recommend, /emi, /partners, /auth, /admin)
│   │   ├── services/           # ChatOrchestrator, SchemeEngine, LocationService, Tools, IntentClassifier
│   │   └── index.ts            # Express server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/                    # Next.js App Router (Landing page, Chat interface, Admin, Schemes, Partners)
│   ├── components/             # ChatInterface, SchemeResultCard, EMIResultCard, PartnerResultCard, Map, NavBar
│   ├── context/                # LanguageContext (English, Hindi, Marathi state management)
│   ├── lib/                    # API helper functions & text formatting utilities
│   ├── package.json
│   └── .env.local.example
├── presentation-brief.md       # PPT source brief
├── PROJECT_EXPLANATION.md      # Detailed comprehensive project document
└── README.md                   # Quickstart instructions
```

---

## 9. Running the Application Locally

### Prerequisites
- Node.js v18+
- PostgreSQL database with `postgis` extension enabled (Local, Neon, or Supabase)
- OpenRouter API Key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL and OPENROUTER_API_KEY in .env
npm run db:migrate
npm run db:migrate-v2
npm run db:migrate-v3
npm run dev
# Backend API runs at http://localhost:4000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev
# Frontend web app runs at http://localhost:3000
```

---

## 10. Summary

**Pradarshak AI** transforms a complex, paper-heavy, and multi-layered channel financing framework into an accessible, grounded, and empowering digital experience. By seamlessly combining natural language understanding with deterministic financial computation and spatial database routing, it ensures that every beneficiary gets the exact scheme, real financial numbers, and nearest partner they need to succeed.
