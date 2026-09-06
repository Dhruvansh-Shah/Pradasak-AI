import type { ToolDef } from '../lib/openrouter';
import { recommendSchemes, fetchActiveSchemes, fetchSchemeByName, fetchSchemeById } from './SchemeEngine';
import type { ScoredScheme, Scheme } from './SchemeEngine';
import { geocode, findNearbyPartners } from './LocationService';
import type { UserEntities } from './ConversationSession';

/**
 * Tools.ts
 * ------------------------------------------------------------------
 * The chat orchestrator now runs a single LLM conversation per turn.
 * Instead of a hand-built "extract JSON -> classify intent -> explain"
 * pipeline, the model is given real tools (function calling) and full
 * conversation context. It decides for itself:
 *   - what the user needs (no keyword/intent classifier)
 *   - what parameters to pass (no regex entity extraction)
 *   - whether it has enough info to call a tool, or should ask the user
 *     a clarifying question instead (no hardcoded "missing fields" list)
 *
 * Every tool below is a thin wrapper around the EXISTING deterministic
 * logic (DB scoring, PostGIS search, EMI math) — the model never invents
 * scheme numbers, interest rates, or distances; it only decides when to
 * call these functions and how to explain their real results.
 */

export const TOOL_DEFS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'recommend_schemes',
      description:
        "Look up and score real NSFDC concessional loan schemes from the database that match the applicant's situation or single-scheme detail queries (e.g. 'Tell me more about SUY', 'What is GBS', 'Explain MCF'). Use this whenever the user describes a business/education plan, asks which scheme fits them, or asks for details on a specific scheme. Never guess scheme names, rates, or limits yourself — always call this to get real data.",
      parameters: {
        type: 'object',
        properties: {
          purpose: { type: 'string', description: 'What the loan/education is for OR the specific scheme name/acronym requested by the user, e.g. "tailoring shop", "GBS", "Green Business Scheme"' },
          loan_amount_rs: { type: 'number', description: 'Desired loan amount in rupees' },
          family_income_rs: { type: 'number', description: 'Annual family income in rupees' },
          education_level: { type: 'string', enum: ['school', 'diploma', 'undergraduate', 'postgraduate'] },
          course: { type: 'string' },
          gender: { type: 'string', enum: ['male', 'female'] },
          location: { type: 'string', description: 'City/district, if mentioned' },
          category_hint: { type: 'string', enum: ['education_loan', 'business_loan'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_emi',
      description:
        'Compute the exact monthly EMI, total interest, and total payable for a loan using deterministic financial math. Always call this instead of estimating an EMI figure yourself. If you do not know the loan amount from this conversation, ask the user for it instead of calling this tool with a guess.',
      parameters: {
        type: 'object',
        properties: {
          loan_amount_rs: { type: 'number', description: 'Principal loan amount in rupees' },
          interest_rate_pct: { type: 'number', description: 'Annual interest rate percent. Use the scheme rate if one was already recommended in this conversation.' },
          tenure_months: { type: 'number', description: 'Repayment tenure in months' },
          moratorium_months: { type: 'number', description: 'Moratorium/grace period in months, 0 if none' },
        },
        required: ['loan_amount_rs'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_partners',
      description:
        'Find nearby authorized, financially healthy NSFDC channel partners (State Channelizing Agencies, Rural Banks, etc.) using geo-spatial search. Requires a city or district — if the user has not given one anywhere in the conversation, ask for it instead of calling this tool.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or district name' },
          category: { type: 'string', description: 'Scheme category to filter partners by, if known (e.g. micro_finance, term_loan, education_loan)' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_required_documents',
      description: 'Get the official checklist of documents required to apply, optionally tailored to a specific scheme.',
      parameters: {
        type: 'object',
        properties: {
          scheme_id: { type: 'number', description: 'Numeric ID of the scheme, if known' },
          scheme_name: { type: 'string', description: 'Name of the scheme the user is applying for, if known' },
          is_education: { type: 'boolean', description: 'True if this is for an education loan' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_schemes',
      description: 'Fetch two or more distinct schemes side by side for comparison using scheme IDs or names.',
      parameters: {
        type: 'object',
        properties: {
          scheme_ids: { type: 'array', items: { type: 'number' }, description: 'Array of numeric scheme IDs to compare' },
          scheme_names: { type: 'array', items: { type: 'string' }, description: 'Array of scheme names/acronyms to compare' },
        },
      },
    },
  },
];

export interface ToolResult {
  toolName: string;
  data: Record<string, unknown>;
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case 'recommend_schemes': {
      const entities: UserEntities = {
        purpose: args.purpose as string | undefined,
        loan_amount_rs: args.loan_amount_rs as number | undefined,
        family_income_rs: args.family_income_rs as number | undefined,
        education_level: args.education_level as string | undefined,
        course: args.course as string | undefined,
        gender: args.gender as string | undefined,
        location: args.location as string | undefined,
      };
      const categoryHint = args.category_hint as string | undefined;
      const schemes: ScoredScheme[] = await recommendSchemes(entities, categoryHint === 'education_loan' ? 'education_loan' : undefined);

      let nearestPartner: unknown = null;
      if (entities.location) {
        const pt = await geocode(entities.location);
        if (pt) {
          const nearby = await findNearbyPartners(pt, schemes[0]?.category, 150, 1);
          nearestPartner = nearby[0] || null;
        }
      }

      // Direct single-scheme lookup returns ONLY 1 scheme; generic queries return top 3
      const isDirectMatch = schemes[0] && schemes[0].score >= 100;
      const returnedSchemes = isDirectMatch ? schemes.slice(0, 1) : schemes.slice(0, 3);

      return {
        toolName: name,
        data: { schemes: returnedSchemes, nearestPartner },
      };
    }

    case 'calculate_emi': {
      const principal = Number(args.loan_amount_rs) || 0;
      const rate = Number(args.interest_rate_pct) || 7;
      const tenure = Number(args.tenure_months) || 60;
      const moratorium = Number(args.moratorium_months) || 0;

      let effectivePrincipal = principal;
      if (moratorium > 0) {
        const r = rate / 100 / 12;
        for (let i = 0; i < moratorium; i++) effectivePrincipal *= 1 + r;
      }

      const emi = calcEMI(effectivePrincipal, rate, tenure);
      const totalPayable = emi * tenure;
      const totalInterest = totalPayable - principal;

      return {
        toolName: name,
        data: {
          emi: Math.round(emi),
          totalPayable: Math.round(totalPayable),
          totalInterest: Math.round(totalInterest),
          principal,
          interestRatePct: rate,
          tenureMonths: tenure,
          moratoriumMonths: moratorium,
        },
      };
    }

    case 'find_partners': {
      const location = args.location as string;
      const category = args.category as string | undefined;
      const point = await geocode(location);
      if (!point) {
        return { toolName: name, data: { error: `Could not locate "${location}". Ask the user for a nearby major district or state capital.` } };
      }
      const partners = await findNearbyPartners(point, category, 150, 4);
      return { toolName: name, data: { partners, location } };
    }

    case 'get_required_documents': {
      let scheme: Scheme | null = null;
      if (args.scheme_id != null) {
        scheme = await fetchSchemeById(Number(args.scheme_id));
      }
      const schemeName = args.scheme_name as string | undefined;
      if (!scheme && schemeName) {
        scheme = await fetchSchemeByName(schemeName);
      }
      const isEdu = Boolean(args.is_education) || scheme?.category === 'education_loan';

      const mandatoryDocuments = [
        'Aadhaar Card (Proof of Identity & Address)',
        'Valid Scheduled Caste (SC) Certificate issued by Revenue Authority (Tahsildar/SDM)',
        'Income Certificate / Salary Slip (Annual family income ≤ ₹5.00 Lakh)',
        'Bank Account Passbook / Statement (Aadhaar linked for DBT)',
        'Passport-size Photographs (2 copies)',
      ];

      const conditionalDocuments = isEdu
        ? [
            'Admission Offer Letter / Bonafide Certificate from College/University',
            'Fee Structure Breakdown (Tuition, Hostel, Books, Exam fees)',
            'Educational Marksheets (10th, 12th, or Graduation degree)',
          ]
        : [
            'Detailed Business Plan / Project Proposal',
            'Machinery / Equipment / Stock Quotation from Authorized Vendor',
            'Rent Agreement or Land Ownership Document (for business premises)',
          ];

      const allDocs = scheme?.documents_required && scheme.documents_required.length > 0
        ? Array.from(new Set([...mandatoryDocuments, ...scheme.documents_required, ...conditionalDocuments]))
        : [...mandatoryDocuments, ...conditionalDocuments];

      return {
        toolName: name,
        data: {
          schemeId: scheme?.id || null,
          schemeName: scheme?.name || schemeName || null,
          documents: allDocs,
          mandatoryDocuments,
          conditionalDocuments,
          note: 'Original certificates must be presented for in-person verification at the Channel Partner branch.',
          scheme: scheme || null,
        },
      };
    }

    case 'compare_schemes': {
      const ids = (args.scheme_ids as number[] | undefined) || [];
      const names = (args.scheme_names as string[] | undefined) || [];

      const fetchedSchemes: Scheme[] = [];

      if (ids.length > 0) {
        for (const id of ids) {
          const s = await fetchSchemeById(Number(id));
          if (s) fetchedSchemes.push(s);
        }
      } else if (names.length > 0) {
        for (const nm of names) {
          const s = await fetchSchemeByName(nm);
          if (s && !fetchedSchemes.some((f) => f.id === s.id)) fetchedSchemes.push(s);
        }
      }

      // If fewer than 2 schemes resolved, fill with active schemes
      if (fetchedSchemes.length < 2) {
        const active = await fetchActiveSchemes();
        for (const act of active) {
          if (!fetchedSchemes.some((f) => f.id === act.id)) {
            fetchedSchemes.push(act);
            if (fetchedSchemes.length >= 2) break;
          }
        }
      }

      return {
        toolName: name,
        data: {
          schemes: fetchedSchemes,
          schemeA: fetchedSchemes[0] || null,
          schemeB: fetchedSchemes[1] || null,
        },
      };
    }

    default:
      return { toolName: name, data: { error: `Unknown tool: ${name}` } };
  }
}

function calcEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}
