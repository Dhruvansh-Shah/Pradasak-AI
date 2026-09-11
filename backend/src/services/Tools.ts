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
      description: 'Search and score NSFDC government loan schemes from the database. Call this whenever the user asks about loans, schemes, financial assistance, business funding, education loans, or wants scheme recommendations. Also call this when the user describes a business plan, educational goal, or asks "what schemes are available".',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The user\'s search query or question about schemes' },
          purpose: { type: 'string', description: 'Loan purpose, business type, or scheme name/acronym (e.g. tailoring, education, MCF, dairy)' },
          loan_amount_rs: { type: 'number', description: 'Requested loan amount in rupees' },
          family_income_rs: { type: 'number', description: 'Annual family income in rupees' },
          education_level: { type: 'string', enum: ['school', 'diploma', 'undergraduate', 'postgraduate'] },
          course: { type: 'string' },
          gender: { type: 'string', enum: ['male', 'female'] },
          location: { type: 'string', description: 'City or district' },
          category_hint: { type: 'string', enum: ['education_loan', 'business_loan'], description: 'Set to education_loan for education/study queries, business_loan for business/trade queries' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_emi',
      description: 'Compute exact monthly EMI, total interest, and repayment schedule for a loan amount and interest rate.',
      parameters: {
        type: 'object',
        properties: {
          loan_amount_rs: { type: 'number', description: 'Principal loan amount in rupees' },
          interest_rate_pct: { type: 'number', description: 'Annual interest rate percent' },
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
      description: 'Find nearby authorized NSFDC channel partner banks and agencies using geo-spatial search.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or district name' },
          category: { type: 'string', description: 'Scheme category filter' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_required_documents',
      description: 'Get required application documents checklist for a scheme.',
      parameters: {
        type: 'object',
        properties: {
          scheme_id: { type: 'number', description: 'Numeric ID of the scheme' },
          scheme_name: { type: 'string', description: 'Name of the scheme' },
          is_education: { type: 'boolean', description: 'True if for education loan' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_schemes',
      description: 'Fetch two or more schemes side by side for comparison using scheme IDs or names.',
      parameters: {
        type: 'object',
        properties: {
          scheme_ids: { type: 'array', items: { type: 'number' }, description: 'Array of scheme IDs' },
          scheme_names: { type: 'array', items: { type: 'string' }, description: 'Array of scheme names' },
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
      const rawPurpose = ((args.purpose || args.query || '') as string).trim();
      const lowerPurpose = rawPurpose.toLowerCase();

      const isEdu =
        args.category_hint === 'education_loan' ||
        lowerPurpose.includes('education') ||
        lowerPurpose.includes('study') ||
        lowerPurpose.includes('college') ||
        lowerPurpose.includes('school') ||
        lowerPurpose.includes('degree') ||
        lowerPurpose.includes('course') ||
        lowerPurpose.includes('student') ||
        lowerPurpose.includes('scholarship') ||
        lowerPurpose.includes('university') ||
        lowerPurpose.includes('btech') ||
        lowerPurpose.includes('mba') ||
        lowerPurpose.includes('mbbs') ||
        lowerPurpose.includes('विद्या') ||
        lowerPurpose.includes('शिक्षा') ||
        lowerPurpose.includes('शिक्षण') ||
        lowerPurpose.includes('पढ़ाई');

      const isWomen =
        args.category_hint === 'women-exclusive' ||
        args.gender === 'female' ||
        lowerPurpose.includes('women') ||
        lowerPurpose.includes('mahila') ||
        lowerPurpose.includes('महिला');

      const categoryHint = (args.category_hint as string | undefined) || (isEdu ? 'education_loan' : undefined);

      const entities: UserEntities = {
        purpose: rawPurpose || undefined,
        loan_amount_rs: args.loan_amount_rs as number | undefined,
        family_income_rs: args.family_income_rs as number | undefined,
        education_level: args.education_level as string | undefined,
        course: args.course as string | undefined,
        gender: (args.gender as string | undefined) || (isWomen ? 'female' : undefined),
        location: args.location as string | undefined,
      };
      const schemes: ScoredScheme[] = await recommendSchemes(entities, categoryHint);

      let nearestPartner: unknown = null;
      if (entities.location) {
        const pt = await geocode(entities.location);
        if (pt) {
          const nearby = await findNearbyPartners(pt, schemes[0]?.category, 150, 1);
          nearestPartner = nearby[0] || null;
        }
      }

      // Direct single-scheme lookup (by specific acronym or exact scheme name) returns 1 scheme; category/intent inquiries return top schemes
      const isSpecificSchemeLookup =
        schemes[0] &&
        rawPurpose &&
        (schemes[0].name.toLowerCase().includes(rawPurpose.toLowerCase()) ||
          (schemes[0].short_name && schemes[0].short_name.toLowerCase() === rawPurpose.toLowerCase()) ||
          (schemes[0].aliases && schemes[0].aliases.some((a) => a.toLowerCase() === rawPurpose.toLowerCase())));

      const isCategoryInquiry =
        isEdu ||
        isWomen ||
        args.category_hint != null ||
        /suggest|recommend|find|best|good|list|available|options|what schemes|which schemes/i.test(rawPurpose);

      const returnedSchemes = isSpecificSchemeLookup && !isCategoryInquiry ? schemes.slice(0, 1) : schemes.slice(0, 3);

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
