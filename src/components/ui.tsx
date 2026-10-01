import Link from "next/link";
import { unitLabel, formatCurrency } from "@/lib/value";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-brand-700 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <SwapIcon className="h-5 w-5" />
      </span>
      <span className="text-lg tracking-tight">ServiceSwap</span>
    </Link>
  );
}

export function SwapIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3 21 7 17 11" />
      <path d="M21 7H4" />
      <path d="M7 21 3 17 7 13" />
      <path d="M3 17h17" />
    </svg>
  );
}

export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white"
      style={{
        backgroundColor: color || "#33806c",
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-brand-100 text-brand-800",
  DECLINED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PriceTag({
  pricingModel,
  hourlyRate,
  fixedValue,
}: {
  pricingModel: string;
  hourlyRate: number;
  fixedValue: number;
}) {
  if (pricingModel === "FIXED") {
    return (
      <span className="font-semibold text-brand-700">
        {formatCurrency(fixedValue)}{" "}
        <span className="font-normal text-gray-500">/ {unitLabel("FIXED")}</span>
      </span>
    );
  }
  return (
    <span className="font-semibold text-brand-700">
      {formatCurrency(hourlyRate)}
      <span className="font-normal text-gray-500">/hr</span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <SwapIcon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
