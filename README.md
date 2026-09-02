# 🏛️ Pradarshak AI (प्रदर्शक AI)
### Intelligent Channel Finance & Concessional Loan Discovery Platform for SC Beneficiaries

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-purple?style=flat-square)](https://openrouter.ai/)

---

## 📌 Executive Summary

Government channel finance schemes provide concessional loans to Scheduled Caste (SC) beneficiaries (annual family income ≤ ₹5 Lakh) covering up to 90%–95% of project or educational costs at subsidized interest rates (6.5% – 8%). However, beneficiaries cannot apply directly at the central level; funds are routed through **100+ Channel Partners** (State Channelizing Agencies, Public Sector Banks, Regional Rural Banks, and NBFC-MFIs).

This structure introduces three critical friction points:
1. **Scheme Discovery & Eligibility Confusion:** Applicants cannot easily determine whether they qualify for Micro Finance (≤ ₹1.4L), Mahila Samriddhi, Term Loans (≤ ₹50L), or Education Loans.
2. **EMI & Moratorium Uncertainty:** Calculating accurate monthly commitments across varying interest brackets, caps, and 3–12 month moratorium terms is difficult for first-time borrowers.
3. **Misrouting to Channel Partners:** Beneficiaries struggle to identify which nearby partner handles their specific scheme category and has active fund allocations and low NPAs.

**Pradarshak AI** solves this through a **chat-first, multilingual platform** that pairs grounded Large Language Models (LLMs) with mathematical computing and spatial indexing—recommending tailored schemes, calculating real EMIs, and routing citizens to the nearest healthy Channel Partner.

---

## 🌟 Key Features

### 1. 🤖 Grounded AI Scheme Recommender
- **Natural Language Interaction:** Users speak or type queries in plain language (e.g., *"I want to set up a tailoring unit in Jaipur, family income ₹3 Lakh"*).
- **Single Agentic Pipeline (Tool-Calling):** One LLM conversation reads the full chat context and decides for itself what's needed — no keyword/intent classifier and no separate entity-extraction pass. When it needs real numbers it calls a tool (scheme lookup, EMI math, partner search, document checklist) backed by the database or deterministic code, then explains the result using only that real data. If information is missing, the model asks its own natural counter-question instead of guessing.
- **Multilingual Support:** Conversational intelligence across English, Hindi, and regional languages.

### 2. 🧮 Precision Financial & EMI Calculator
- **Deterministic Mathematics:** Interest rates, loan subsidies, and EMI schedules are computed using real financial formulas in code, never guessed by generative AI.
- **Moratorium-Aware:** Handles grace periods (3–12 months) where interest can accrue or be deferred.
- **Custom Scenarios:** Interactive sliders for loan amount, tenure, and down-payment with visual amortisation breakdowns.

### 3. 🗺️ Geo-Spatial Channel Partner Locator
- **PostGIS Spatial Search:** Identifies active channel partners within the applicant’s radius using geo-spatial indexing (`ST_DWithin` / `ST_Distance`).
- **Partner Health Filtering:** Filters out partners with high Non-Performing Assets (NPAs) or exhausted fund allocations.
- **Interactive Mapping:** Built with Leaflet & OpenStreetMap, displaying partner addresses, eligible categories, and contact details.

### 4. 📋 Document & Eligibility Checker
- Interactive checklist generation for required documentation (Caste Certificate, Income Certificate, Project Report, Quotations).
- Step-by-step guidance on how to submit documents to the identified channel partner.

### 5. 🛡️ Administrative & Verification Dashboard
- Dedicated portal for administrative oversight of schemes, partner allocations, and applicant verification queues.
- Real-time management of channel partner statuses and scheme parameters.

---

## 🏗️ Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│   Next.js 16 + React 19 + Tailwind CSS + Leaflet Maps    │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / JSON API
┌────────────────────────────▼─────────────────────────────┐
│                    Backend API Gateway                   │
│               Express.js 5 + TypeScript                  │
├──────────────────────────────────────────────────────────┤
│  • Single tool-calling LLM agent (ChatOrchestrator)      │
│    — decides intent/entities itself, no keyword rules    │
│  • Deterministic EMI Calculation Engine                  │
│  • Spatial Query Builder (PostGIS)                       │
│  • User & Admin Authentication (JWT + Bcrypt)            │
└──────────────┬────────────────────────────┬──────────────┘
               │                            │
   SQL Queries │               LLM Requests │
┌──────────────▼──────────┐      ┌──────────▼──────────────┐
│  PostgreSQL + PostGIS   │      │    OpenRouter AI API    │
│  • Schemes Catalog      │      │  • Google Gemini Flash  │
│  • Channel Partners     │      │  • Claude 3.5 Haiku     │
│  • Spatial Coordinates  │      │  • Multilingual Grounded│
│  • Users & Chat Logs    │      │    Explanations         │
└─────────────────────────┘      └─────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js 16.3 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4, Vanilla CSS Design System
- **Icons:** Lucide React
- **Mapping:** Leaflet & React-Leaflet
- **State & Storage:** React Hooks & Local Storage for session management

### Backend
- **Runtime:** Node.js & TypeScript
- **Framework:** Express.js 5
- **Database:** PostgreSQL with PostGIS extension (hosted on Neon or local Postgres)
- **Database Client:** `pg` with connection pooling
- **AI / LLM Integration:** OpenRouter API (Gemini 1.5 Flash for query generation, Claude 3.5 Haiku for grounded explanations)
- **Security & Auth:** JWT (JSON Web Tokens), `bcryptjs`, CORS middleware

---

## 📁 Repository Structure

```
.
├── backend/                    # Express.js REST API & Database Layer
│   ├── src/
│   │   ├── admin-static/       # Embedded static administrative portal
│   │   ├── db/                 # Database connection pool, schemas & migrations
│   │   │   ├── pool.ts         # PostgreSQL connection pool configuration
│   │   │   ├── schema.sql      # Core schema definitions
│   │   │   ├── seed.sql        # Seed data (Schemes, Channel Partners, Locations)
│   │   │   └── migrate.ts      # Migration execution scripts
│   │   ├── middleware/         # Auth & validation middleware
│   │   ├── routes/             # API Route handlers
│   │   │   ├── chat.ts         # Conversational chat endpoint
│   │   │   ├── recommend.ts    # Scheme recommendation endpoint
│   │   │   ├── emi.ts          # EMI calculation endpoint
│   │   │   ├── partners.ts     # Spatial partner locator endpoint
│   │   │   ├── userAuth.ts     # User authentication routes
│   │   │   └── admin.ts        # Admin management routes
│   │   ├── services/           # Business logic & AI tool-calling agent
│   │   │   ├── ChatOrchestrator.ts   # Single agentic loop (tool-calling)
│   │   │   ├── Tools.ts              # Tool schemas + deterministic executors
│   │   │   ├── IntentClassifier.ts   # Lightweight language-detection helper only
│   │   │   ├── SchemeEngine.ts
│   │   │   └── LocationService.ts
│   │   └── index.ts            # Main application entry point
│   ├── .env.example            # Backend environment template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js 16 App Router UI
│   ├── app/
│   │   ├── page.tsx            # Main landing page & interactive tools
│   │   ├── chat/               # Dedicated conversational AI page
│   │   ├── schemes/            # Schemes catalog & filter page
│   │   ├── partners/           # Geo-spatial interactive partner finder
│   │   ├── admin/              # Next.js Admin interface
│   │   ├── auth/               # User Sign In / Register
│   │   ├── globals.css         # Custom tokens, gradients, animations
│   │   └── layout.tsx          # Root HTML layout & fonts
│   ├── components/             # Reusable UI Components
│   │   ├── ChatInterface.tsx   # Complete chat conversation engine
│   │   ├── EmiCalculator.tsx   # Visual EMI calculation component
│   │   ├── PartnerLocator.tsx  # Map & partner search component
│   │   ├── SchemeCard.tsx      # Detailed scheme display card
│   │   ├── Map.tsx             # Dynamic Leaflet map wrapper
│   │   ├── NavBar.tsx          # Header navigation
│   │   └── Footer.tsx          # Global footer
│   ├── .env.local.example      # Frontend environment template
│   ├── package.json
│   └── tsconfig.json
│
├── presentation-brief.md       # Solution pitch, architecture brief & presentation notes
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**
- **PostgreSQL** instance (Neon, Supabase, or local PostgreSQL with `postgis` extension enabled)
- **OpenRouter API Key** (from [openrouter.ai](https://openrouter.ai/keys))

---

### 1. Clone the Repository

```bash
git clone https://github.com/arnav-2205/Pradasak-AI.git
cd Pradasak-AI
```

---

### 2. Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```bash
   cp .env.example .env
   ```

   Fill in your configuration:
   ```env
   # PostgreSQL Connection (Neon or local)
   DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
   DATABASE_READONLY_URL=postgresql://sih_readonly:password@host.neon.tech/neondb?sslmode=require

   # OpenRouter AI Credentials
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
   OPENROUTER_STRONG_MODEL=anthropic/claude-3-5-haiku

   # Server Port
   PORT=4000
   ADMIN_PORT=3001
   ```

4. **Run Database Migrations & Seed Data:**
   ```bash
   npm run db:migrate
   npm run db:migrate-v2
   ```

5. **Start the Backend Server:**
   ```bash
   npm run dev
   ```
   *The API will be available at `http://localhost:4000` and the Admin static panel at `http://localhost:3001`.*

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to `frontend/`:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```

   Add the backend API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```

4. **Start the Frontend Dev Server:**
   ```bash
   npm run dev
   ```
   *The application will be live at `http://localhost:3000`.*

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Main conversational AI orchestration endpoint |
| `POST` | `/api/recommend` | Filters and ranks schemes based on applicant criteria |
| `POST` | `/api/emi/calculate` | Calculates accurate monthly EMI, interest, and moratorium schedule |
| `GET` | `/api/schemes` | Returns active concessional schemes catalog |
| `GET` | `/api/partners/nearby` | Geo-spatial lookup of healthy channel partners (`?lat=...&lng=...&category=...`) |
| `POST` | `/api/users/register` | Beneficiary registration |
| `POST` | `/api/users/login` | Beneficiary authentication |
| `GET` | `/api/admin/metrics` | System-wide partner metrics and application volume |
| `GET` | `/api/health` | Service health check status |

---

## 🔒 Security & Best Practices

- **Strict Separation of Secrets:** No database credentials or LLM API keys are exposed to the client; all queries are mediated by the backend server.
- **Read-Only Database Role for LLM SQL Generation:** Dynamic queries generated during conversational extraction are executed on a restricted read-only role (`sih_readonly`).
- **Grounded Verification:** System prompts enforce that all numerical quotes (rates, caps, subsidy percentages) match the verified database records verbatim.

---

## 👥 Authors & Team

Developed for the **Smart India Hackathon (SIH)**.
- **Repository:** [arnav-2205/Pradasak-AI](https://github.com/arnav-2205/Pradasak-AI)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
