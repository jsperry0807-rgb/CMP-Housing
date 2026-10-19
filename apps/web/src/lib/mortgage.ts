export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  /** Annual interest rate as a percentage, e.g. 6.5 for 6.5%. */
  annualRate: number;
  termYears: number;
  annualPropertyTax: number;
  annualInsurance: number;
  monthlyHoa: number;
}

export interface MortgageResult {
  loanAmount: number;
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyTotal: number;
  /** Interest paid over the whole term. */
  totalInterest: number;
  /** Down payment plus every monthly payment over the term. */
  totalPaid: number;
}

/**
 * The standard amortising loan payment:
 *
 *   M = P * r / (1 - (1 + r)^-n)
 *
 * with `r` the monthly rate and `n` the number of monthly payments.
 * A zero rate falls back to a straight division, and a zero loan costs nothing.
 */
export function calculateMortgage(input: MortgageInput): MortgageResult {
  const homePrice = Math.max(0, input.homePrice);
  const downPayment = Math.min(Math.max(0, input.downPayment), homePrice);
  const loanAmount = Math.max(0, homePrice - downPayment);

  const monthlyRate = Math.max(0, input.annualRate) / 100 / 12;
  const months = Math.max(1, Math.round(input.termYears * 12));

  const monthlyPrincipalAndInterest =
    loanAmount === 0
      ? 0
      : monthlyRate === 0
        ? loanAmount / months
        : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  const monthlyPropertyTax = Math.max(0, input.annualPropertyTax) / 12;
  const monthlyInsurance = Math.max(0, input.annualInsurance) / 12;
  const monthlyHoa = Math.max(0, input.monthlyHoa);

  const monthlyTotal =
    monthlyPrincipalAndInterest +
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyHoa;

  return {
    loanAmount,
    monthlyPrincipalAndInterest,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHoa,
    monthlyTotal,
    totalInterest: monthlyPrincipalAndInterest * months - loanAmount,
    totalPaid: downPayment + monthlyTotal * months,
  };
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$450,000" — for headline figures and totals. */
export function formatMoney(value: number): string {
  return money.format(Number.isFinite(value) ? value : 0);
}

/** "$2,844.08" — for monthly payments, where cents matter. */
export function formatMoneyCents(value: number): string {
  return moneyCents.format(Number.isFinite(value) ? value : 0);
}
