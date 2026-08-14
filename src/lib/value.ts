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

export interface Balance {
  offeredValue: number;
  requestedValue: number;
  difference: number; // requested - offered (positive => initiator receives more)
  absDifference: number;
  ratio: number; // offered / requested
  fairnessPct: number; // 0-100, 100 = perfectly balanced
  status: "balanced" | "initiator-favored" | "recipient-favored";
  label: string;
}

/** Compare the two sides of a swap and describe how fair it is. */
export function computeBalance(offeredValue: number, requestedValue: number): Balance {
  const difference = round2(requestedValue - offeredValue);
  const absDifference = Math.abs(difference);
  const maxSide = Math.max(offeredValue, requestedValue, 1);
  const fairnessPct = Math.round((1 - absDifference / maxSide) * 100);
  const ratio = requestedValue > 0 ? round2(offeredValue / requestedValue) : 0;

  // Within 5% (or $10) counts as balanced.
  const balanced = absDifference <= Math.max(10, maxSide * 0.05);

  let status: Balance["status"] = "balanced";
  let label = "Balanced trade";
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
    difference,
    absDifference,
    ratio,
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
