// Value-equivalence helpers — the heart of a fair service swap.

export type PricingModel = "HOURLY" | "FIXED";

export interface ServiceLike {
  pricingModel: string;
  hourlyRate: number;
  fixedValue: number;
}

/** The value of `qty` units of a service (hours for HOURLY, count for FIXED). */
export function serviceValue(service: ServiceLike, qty: number): number {
  const q = Number.isFinite(qty) && qty > 0 ? qty : 0;
  if (service.pricingModel === "FIXED") {
    return round2(service.fixedValue * q);
  }
  return round2(service.hourlyRate * q);
}

/** Unit label for a service's quantity. */
export function unitLabel(pricingModel: string, qty = 1): string {
  if (pricingModel === "FIXED") return qty === 1 ? "project" : "projects";
  return qty === 1 ? "hour" : "hours";
}

export type CashPayer = "NONE" | "INITIATOR" | "RECIPIENT";

export interface Balance {
  offeredValue: number; // service value the initiator gives
  requestedValue: number; // service value the initiator receives
  cashTopUp: number;
  cashPayer: CashPayer;
  offeredTotal: number; // service + cash the initiator gives
  requestedTotal: number; // service + cash the initiator receives
  difference: number; // requestedTotal - offeredTotal (positive => initiator receives more)
  absDifference: number;
  fairnessPct: number; // 0-100, 100 = perfectly balanced
  status: "balanced" | "initiator-favored" | "recipient-favored";
  label: string;
}

/**
 * Who should add cash to even out a service-only trade, and how much.
 * Cash always flows from the short side to the long side.
 */
export function suggestCash(
  offeredValue: number,
  requestedValue: number
): { payer: CashPayer; amount: number } {
  const diff = round2(requestedValue - offeredValue);
  if (Math.abs(diff) < 0.01) return { payer: "NONE", amount: 0 };
  // Initiator's service is worth less => initiator adds cash.
  if (diff > 0) return { payer: "INITIATOR", amount: diff };
  // Initiator's service is worth more => recipient adds cash.
  return { payer: "RECIPIENT", amount: Math.abs(diff) };
}

/** Compare the two sides of a swap (including any cash) and describe how fair it is. */
export function computeBalance(
  offeredValue: number,
  requestedValue: number,
  cashTopUp = 0,
  cashPayer: CashPayer = "NONE"
): Balance {
  const cash = cashPayer === "NONE" ? 0 : Math.max(0, cashTopUp || 0);

  const offeredTotal = round2(offeredValue + (cashPayer === "INITIATOR" ? cash : 0));
  const requestedTotal = round2(requestedValue + (cashPayer === "RECIPIENT" ? cash : 0));

  const difference = round2(requestedTotal - offeredTotal);
  const absDifference = Math.abs(difference);
  const maxSide = Math.max(offeredTotal, requestedTotal, 1);
  const fairnessPct = Math.round((1 - absDifference / maxSide) * 100);

  // Within 5% (or $10) counts as balanced.
  const balanced = absDifference <= Math.max(10, maxSide * 0.05);

  let status: Balance["status"] = "balanced";
  let label = cash > 0 ? "Balanced with cash" : "Balanced trade";
  if (!balanced) {
    if (difference > 0) {
      status = "recipient-favored";
      label = `You'd receive ${formatCurrency(absDifference)} more value than you give`;
    } else {
      status = "initiator-favored";
      label = `You'd give ${formatCurrency(absDifference)} more value than you receive`;
    }
  }

  return {
    offeredValue: round2(offeredValue),
    requestedValue: round2(requestedValue),
    cashTopUp: round2(cash),
    cashPayer: cash > 0 ? cashPayer : "NONE",
    offeredTotal,
    requestedTotal,
    difference,
    absDifference,
    fairnessPct: Math.max(0, Math.min(100, fairnessPct)),
    status,
    label,
  };
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
