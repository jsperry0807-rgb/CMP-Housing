import {
  ArrowRight,
  Building2,
  Calculator,
  Info,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  calculateMortgage,
  formatMoney,
  formatMoneyCents,
} from "@/lib/mortgage";
import { cn } from "@/lib/utils";

const TERM_ITEMS: Record<string, string> = {
  "30": "30 years",
  "20": "20 years",
  "15": "15 years",
  "10": "10 years",
};

const DOWN_PRESETS = [5, 10, 20];

/** Reads a non-negative number from the query string, e.g. a listing's price. */
function queryNumber(query: URLSearchParams, key: string): string | undefined {
  const raw = query.get(key);
  if (!raw) return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0
    ? String(Math.round(parsed))
    : undefined;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  invalid,
  step = "any",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
  invalid?: boolean;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          className={cn("h-9", prefix && "pl-7", suffix && "pr-8")}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BreakdownRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className={cn("size-2.5 shrink-0 rounded-full", color)} />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="shrink-0 tabular-nums">{formatMoneyCents(value)}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export default function MortgageCalculator({
  query,
}: {
  query: URLSearchParams;
}) {
  const [homePrice, setHomePrice] = useState(
    () => queryNumber(query, "price") ?? "400000",
  );
  const [downPayment, setDownPayment] = useState(() =>
    String(Math.round(toNumber(queryNumber(query, "price") ?? "400000") * 0.2)),
  );
  const [annualRate, setAnnualRate] = useState("6.5");
  const [termYears, setTermYears] = useState("30");
  const [propertyTax, setPropertyTax] = useState(
    () => queryNumber(query, "tax") ?? "3600",
  );
  const [insurance, setInsurance] = useState("1800");
  const [hoa, setHoa] = useState("0");

  const price = toNumber(homePrice);
  const down = toNumber(downPayment);
  const downTooBig = price > 0 && down > price;

  const result = useMemo(
    () =>
      calculateMortgage({
        homePrice: price,
        downPayment: down,
        annualRate: toNumber(annualRate),
        termYears: Math.max(1, toNumber(termYears)),
        annualPropertyTax: toNumber(propertyTax),
        annualInsurance: toNumber(insurance),
        monthlyHoa: toNumber(hoa),
      }),
    [price, down, annualRate, termYears, propertyTax, insurance, hoa],
  );

  const downPercent =
    price > 0 ? Math.round((Math.min(down, price) / price) * 100) : 0;

  const breakdown = [
    {
      label: "Principal & interest",
      value: result.monthlyPrincipalAndInterest,
      color: "bg-chart-5",
    },
    {
      label: "Property tax",
      value: result.monthlyPropertyTax,
      color: "bg-chart-3",
    },
    {
      label: "Home insurance",
      value: result.monthlyInsurance,
      color: "bg-chart-2",
    },
    { label: "HOA dues", value: result.monthlyHoa, color: "bg-chart-1" },
  ];

  function setDownPercent(percent: number) {
    setDownPayment(String(Math.round((price * percent) / 100)));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calculator className="size-4" />
          Tool
        </div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Mortgage calculator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimate what a house would cost each month, including taxes,
          insurance and HOA dues. Pick a design from the browse page and its
          price comes along automatically.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Loan details</CardTitle>
            <CardDescription>
              Adjust the numbers to match the loan you have in mind.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="home-price"
                label="Home price"
                prefix="$"
                value={homePrice}
                onChange={setHomePrice}
              />

              <NumberField
                id="down-payment"
                label="Down payment"
                prefix="$"
                value={downPayment}
                onChange={setDownPayment}
                invalid={downTooBig}
                hint={
                  downTooBig ? (
                    <span className="text-destructive">
                      That is more than the home price.
                    </span>
                  ) : (
                    <>
                      {downPercent}% of the price ·{" "}
                      {formatMoney(Math.max(0, price - Math.min(down, price)))}{" "}
                      loan
                    </>
                  )
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {DOWN_PRESETS.map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setDownPercent(percent)}
                  aria-pressed={downPercent === percent}
                  className={cn(
                    buttonVariants({
                      variant:
                        downPercent === percent ? "secondary" : "outline",
                      size: "sm",
                    }),
                  )}
                >
                  {percent}% down
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="interest-rate"
                label="Interest rate"
                suffix="%"
                step="0.1"
                value={annualRate}
                onChange={setAnnualRate}
                hint="The annual rate before any fees."
              />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loan-term">Loan term</Label>
                <Select
                  items={TERM_ITEMS}
                  value={termYears}
                  onValueChange={(value) => setTermYears(String(value))}
                >
                  <SelectTrigger id="loan-term" className="h-9! w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TERM_ITEMS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How long you have to repay the loan.
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium">Other monthly costs</p>
              <p className="text-xs text-muted-foreground">
                Optional — leave a field at 0 to skip it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                id="property-tax"
                label="Property tax"
                prefix="$"
                value={propertyTax}
                onChange={setPropertyTax}
                hint="Per year"
              />
              <NumberField
                id="insurance"
                label="Home insurance"
                prefix="$"
                value={insurance}
                onChange={setInsurance}
                hint="Per year"
              />
              <NumberField
                id="hoa"
                label="HOA dues"
                prefix="$"
                value={hoa}
                onChange={setHoa}
                hint="Per month"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Estimated monthly payment
              </p>
              <p className="mt-1 font-heading text-4xl font-semibold tracking-tight">
                {formatMoneyCents(result.monthlyTotal)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Principal, interest, taxes, insurance and HOA
              </p>
            </div>

            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label="Monthly payment breakdown"
            >
              {breakdown.map((part) =>
                result.monthlyTotal > 0 && part.value > 0 ? (
                  <div
                    key={part.label}
                    className={cn("h-full", part.color)}
                    style={{
                      width: `${(part.value / result.monthlyTotal) * 100}%`,
                    }}
                  />
                ) : null,
              )}
            </div>

            <dl className="flex flex-col gap-2.5 text-sm">
              {breakdown.map((part) => (
                <BreakdownRow key={part.label} {...part} />
              ))}
            </dl>

            <Separator />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <Stat
                label="Loan amount"
                value={formatMoney(result.loanAmount)}
              />
              <Stat
                label="Down payment"
                value={formatMoney(Math.min(down, price))}
              />
              <Stat
                label="Total interest"
                value={formatMoney(result.totalInterest)}
              />
              <Stat
                label={`Total over ${termYears} years`}
                value={formatMoney(result.totalPaid)}
              />
            </dl>

            <div className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                An estimate only, not a loan offer. Your lender's rate, fees and
                escrow requirements will change the real payment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="flex gap-3 rounded-xl border bg-card p-4">
          <PiggyBank className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">A bigger down payment</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Lowers the loan amount and the interest you pay over the term.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border bg-card p-4">
          <Receipt className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Don't forget escrow</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Property tax and insurance are often collected monthly with the
              payment.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border bg-card p-4">
          <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Compare designs</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Browse the finished houses and estimate the payment on each one.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a href="#/listings" className={cn(buttonVariants({ size: "lg" }))}>
          <Building2 />
          Browse designs
          <ArrowRight />
        </a>
        <a
          href="#/"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Wallet />
          Back to the homepage
        </a>
      </div>
    </div>
  );
}
