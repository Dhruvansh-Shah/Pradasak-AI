export type BorrowerMode = 'individual' | 'msme';

export interface FinancialPlanInput {
  principal: number; // in Rupees
  annualRatePercent: number; // e.g. 7 for 7%
  totalTenureMonths: number; // e.g. 60
  moratoriumMonths?: number; // e.g. 6 (default: 0)
  borrowerMode?: BorrowerMode; // 'individual' | 'msme' (default: 'individual')
  informalRatePercent?: number; // default: 36
}

export interface AmortizationMonth {
  month: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  isMoratorium: boolean;
}

export interface FinancialPlanResult {
  borrowerMode: BorrowerMode;
  requestedPrincipal: number;
  annualRatePercent: number;
  totalTenureMonths: number;
  moratoriumMonths: number;
  repaymentMonths: number;
  
  // Margin Money & CGTMSE
  promoterMarginPercent: number; // 5% for individual, 10% for MSME
  loanFundingPercent: number; // 95% for individual, 90% for MSME
  totalProjectOutlay: number; // Total project cost
  promoterContribution: number; // Beneficiary's equity contribution
  cgtmseEligible: boolean;
  cgtmseBadge: string | null;

  // Moratorium Math
  moratoriumSimpleInterest: number; // Simple interest accrued during grace period
  capitalizedPrincipal: number; // P_adj = P + moratoriumSimpleInterest
  monthlyEMI: number; // Calculated on P_adj over (tenure - moratorium)
  totalRepayment: number;
  totalInterest: number;
  principalPercent: number;
  interestPercent: number;

  // Informal Moneylender Comparison (Debt Trap Shield)
  informalRatePercent: number; // 36% standard
  informalMonthlyEMI: number;
  informalTotalRepayment: number;
  informalTotalInterest: number;
  netWealthPreserved: number; // Wealth protected from predatory informal debt

  // Full Amortization
  schedule: AmortizationMonth[];
}

export function calculateFinancialPlan(input: FinancialPlanInput): FinancialPlanResult {
  const principal = Math.max(1000, input.principal);
  const annualRate = Math.max(0.1, input.annualRatePercent);
  const totalTenure = Math.max(1, input.totalTenureMonths);
  const moratorium = Math.min(Math.max(0, input.moratoriumMonths || 0), totalTenure - 1);
  const mode: BorrowerMode = input.borrowerMode === 'msme' ? 'msme' : 'individual';
  const informalRate = input.informalRatePercent || 36;

  // 1. Dual-Mode Margin Money (Individual: 5% margin / 95% loan; MSME: 10% margin / 90% loan)
  const isMsme = mode === 'msme';
  const promoterMarginPercent = isMsme ? 10 : 5;
  const loanFundingPercent = isMsme ? 90 : 95;
  const totalProjectOutlay = Math.round(principal / (loanFundingPercent / 100));
  const promoterContribution = Math.round(totalProjectOutlay - principal);
  const cgtmseEligible = isMsme;
  const cgtmseBadge = isMsme
    ? 'CGTMSE Eligible: Collateral-Free Credit Guarantee (up to ₹5 Crore)'
    : null;

  // 2. Moratorium Simple Interest & Capitalization
  const repaymentMonths = Math.max(1, totalTenure - moratorium);
  const moratoriumSimpleInterest = Math.round(
    principal * (annualRate / 100) * (moratorium / 12)
  );
  const capitalizedPrincipal = principal + moratoriumSimpleInterest;

  // 3. Monthly EMI Calculation over repayment period
  const monthlyRate = annualRate / 100 / 12;
  let monthlyEMI = 0;
  if (monthlyRate > 0) {
    monthlyEMI = Math.round(
      (capitalizedPrincipal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths)) /
        (Math.pow(1 + monthlyRate, repaymentMonths) - 1)
    );
  } else {
    monthlyEMI = Math.round(capitalizedPrincipal / repaymentMonths);
  }

  const totalRepayment = monthlyEMI * repaymentMonths;
  const totalInterest = totalRepayment - principal;
  const principalPercent = Math.round((principal / (totalRepayment || 1)) * 100);
  const interestPercent = 100 - principalPercent;

  // 4. Informal Moneylender Compounding Math (36% APR compound)
  const informalMonthlyRate = informalRate / 100 / 12;
  const informalMonthlyEMI = Math.round(
    (principal * informalMonthlyRate * Math.pow(1 + informalMonthlyRate, totalTenure)) /
      (Math.pow(1 + informalMonthlyRate, totalTenure) - 1)
  );
  const informalTotalRepayment = informalMonthlyEMI * totalTenure;
  const informalTotalInterest = informalTotalRepayment - principal;
  const netWealthPreserved = Math.max(0, informalTotalInterest - totalInterest);

  // 5. Month-by-Month Amortization Schedule
  const schedule: AmortizationMonth[] = [];
  let balance = principal;

  // Months 1..moratorium: ₹0 principal repayment, simple interest accrues
  if (moratorium > 0) {
    const monthlyAccruedInterest = moratoriumSimpleInterest / moratorium;
    for (let m = 1; m <= moratorium; m++) {
      balance += monthlyAccruedInterest;
      schedule.push({
        month: m,
        emi: 0,
        principalPaid: 0,
        interestPaid: Math.round(monthlyAccruedInterest),
        remainingBalance: Math.round(balance),
        isMoratorium: true,
      });
    }
  }

  // Months (moratorium+1)..totalTenure: Standard amortizing EMI
  let amortBalance = capitalizedPrincipal;
  for (let m = moratorium + 1; m <= totalTenure; m++) {
    const interestForMonth = amortBalance * monthlyRate;
    const principalPaid = Math.min(amortBalance, monthlyEMI - interestForMonth);
    amortBalance = Math.max(0, amortBalance - principalPaid);

    schedule.push({
      month: m,
      emi: monthlyEMI,
      principalPaid: Math.round(principalPaid),
      interestPaid: Math.round(interestForMonth),
      remainingBalance: Math.round(amortBalance),
      isMoratorium: false,
    });
  }

  return {
    borrowerMode: mode,
    requestedPrincipal: principal,
    annualRatePercent: annualRate,
    totalTenureMonths: totalTenure,
    moratoriumMonths: moratorium,
    repaymentMonths,
    promoterMarginPercent,
    loanFundingPercent,
    totalProjectOutlay,
    promoterContribution,
    cgtmseEligible,
    cgtmseBadge,
    moratoriumSimpleInterest,
    capitalizedPrincipal,
    monthlyEMI,
    totalRepayment,
    totalInterest,
    principalPercent,
    interestPercent,
    informalRatePercent: informalRate,
    informalMonthlyEMI,
    informalTotalRepayment,
    informalTotalInterest,
    netWealthPreserved,
    schedule,
  };
}
