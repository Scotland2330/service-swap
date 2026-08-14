import Link from "next/link";
import { SwapIcon, StatusBadge, Avatar } from "@/components/ui";
import { formatCurrency, unitLabel } from "@/lib/value";

export interface SwapCardData {
  id: string;
  status: string;
  offeredQty: number;
  offeredValue: number;
  requestedQty: number;
  requestedValue: number;
  createdAt: Date;
  offeredService: { title: string; pricingModel: string };
  requestedService: { title: string; pricingModel: string };
  initiator: { id: string; name: string; logoColor: string };
  recipient: { id: string; name: string; logoColor: string };
}

export default function SwapCard({
  swap,
  currentBusinessId,
}: {
  swap: SwapCardData;
  currentBusinessId: string;
}) {
  const iAmInitiator = swap.initiator.id === currentBusinessId;
  const counterparty = iAmInitiator ? swap.recipient : swap.initiator;
  const role = iAmInitiator ? "Sent" : "Received";

  return (
    <Link
      href={`/swaps/${swap.id}`}
      className="card block p-5 transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={`badge ${iAmInitiator ? "bg-gray-100 text-gray-600" : "bg-brand-50 text-brand-700"}`}>
            {role}
          </span>
          <div className="flex items-center gap-1.5">
            <Avatar name={counterparty.name} color={counterparty.logoColor} size={20} />
            <span>{counterparty.name}</span>
          </div>
        </div>
        <StatusBadge status={swap.status} />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-sm">
          <p className="text-xs text-gray-400">{iAmInitiator ? "You give" : "You get"}</p>
          <p className="font-medium text-gray-900">
            {(iAmInitiator ? swap.offeredService : swap.requestedService).title}
          </p>
          <p className="text-gray-500">
            {iAmInitiator ? swap.offeredQty : swap.requestedQty}{" "}
            {unitLabel(
              (iAmInitiator ? swap.offeredService : swap.requestedService).pricingModel,
              iAmInitiator ? swap.offeredQty : swap.requestedQty
            )}{" "}
            · {formatCurrency(iAmInitiator ? swap.offeredValue : swap.requestedValue)}
          </p>
        </div>
        <SwapIcon className="h-5 w-5 text-brand-400" />
        <div className="text-right text-sm">
          <p className="text-xs text-gray-400">{iAmInitiator ? "You get" : "You give"}</p>
          <p className="font-medium text-gray-900">
            {(iAmInitiator ? swap.requestedService : swap.offeredService).title}
          </p>
          <p className="text-gray-500">
            {iAmInitiator ? swap.requestedQty : swap.offeredQty}{" "}
            {unitLabel(
              (iAmInitiator ? swap.requestedService : swap.offeredService).pricingModel,
              iAmInitiator ? swap.requestedQty : swap.offeredQty
            )}{" "}
            · {formatCurrency(iAmInitiator ? swap.requestedValue : swap.offeredValue)}
          </p>
        </div>
      </div>
    </Link>
  );
}
