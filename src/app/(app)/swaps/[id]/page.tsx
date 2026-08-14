import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, SwapIcon, StatusBadge } from "@/components/ui";
import SwapActions from "@/components/SwapActions";
import { addProposalMessageAction } from "@/lib/actions/swapActions";
import { computeBalance, formatCurrency, unitLabel } from "@/lib/value";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  CREATED: "proposed the swap",
  ACCEPTED: "accepted the swap",
  DECLINED: "declined the swap",
  CANCELLED: "withdrew the proposal",
  COMPLETED: "marked the swap complete",
  MESSAGE: "",
};

export default async function SwapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const swap = await prisma.swapProposal.findUnique({
    where: { id },
    include: {
      offeredService: true,
      requestedService: true,
      initiator: true,
      recipient: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!swap) notFound();

  const me = session.sub;
  const isInitiator = swap.initiatorId === me;
  const isRecipient = swap.recipientId === me;
  if (!isInitiator && !isRecipient) redirect("/swaps");

  const balance = computeBalance(swap.offeredValue, swap.requestedValue);
  const counterparty = isInitiator ? swap.recipient : swap.initiator;

  const addMessage = addProposalMessageAction.bind(null, swap.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/swaps" className="text-sm text-brand-700 hover:underline">
        ← Back to swaps
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Swap proposal</h1>
        <StatusBadge status={swap.status} />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {isInitiator ? "You proposed this to" : "Proposed to you by"}{" "}
        <Link href={`/businesses/${counterparty.id}`} className="font-medium text-brand-700 hover:underline">
          {counterparty.name}
        </Link>
      </p>

      {/* The trade */}
      <div className="card mt-6 p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4">
          <TradeSide
            label={isInitiator ? "You give" : `${swap.initiator.name} gives`}
            businessName={swap.initiator.name}
            businessColor={swap.initiator.logoColor}
            serviceTitle={swap.offeredService.title}
            serviceId={swap.offeredServiceId}
            qty={swap.offeredQty}
            unit={unitLabel(swap.offeredService.pricingModel, swap.offeredQty)}
            value={swap.offeredValue}
          />
          <div className="flex items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <SwapIcon className="h-5 w-5" />
            </span>
          </div>
          <TradeSide
            label={isInitiator ? "You get" : `${swap.recipient.name} gives`}
            businessName={swap.recipient.name}
            businessColor={swap.recipient.logoColor}
            serviceTitle={swap.requestedService.title}
            serviceId={swap.requestedServiceId}
            qty={swap.requestedQty}
            unit={unitLabel(swap.requestedService.pricingModel, swap.requestedQty)}
            value={swap.requestedValue}
          />
        </div>

        {/* Balance */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">
              {formatCurrency(swap.offeredValue)} for {formatCurrency(swap.requestedValue)}
            </span>
            <span className={`badge ${balance.status === "balanced" ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-800"}`}>
              {balance.fairnessPct}% balanced
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full ${balance.status === "balanced" ? "bg-brand-500" : "bg-amber-400"}`}
              style={{ width: `${balance.fairnessPct}%` }}
            />
          </div>
        </div>

        {swap.terms && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700">Proposed terms</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{swap.terms}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <SwapActions
            proposalId={swap.id}
            status={swap.status}
            isInitiator={isInitiator}
            isRecipient={isRecipient}
          />
          {swap.status === "COMPLETED" && (
            <p className="text-sm font-medium text-brand-700">
              ✓ This swap is complete. Nice trade!
            </p>
          )}
          {(swap.status === "DECLINED" || swap.status === "CANCELLED") && (
            <p className="text-sm text-gray-500">
              This proposal is closed ({swap.status.toLowerCase()}).
            </p>
          )}
        </div>
      </div>

      {/* Activity / messages */}
      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-gray-900">Activity</h2>
        <ul className="mt-4 space-y-4">
          {swap.events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <div className="mt-0.5">
                <Avatar name={e.actorName} size={28} color={e.actorId === swap.initiator.id ? swap.initiator.logoColor : swap.recipient.logoColor} />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-gray-900">{e.actorName}</span>{" "}
                  {e.kind === "MESSAGE" ? (
                    <span className="text-gray-500">wrote:</span>
                  ) : (
                    <span className="text-gray-500">{EVENT_LABELS[e.kind]}</span>
                  )}
                </p>
                {e.note && (
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {e.note}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {swap.status !== "DECLINED" && swap.status !== "CANCELLED" && (
          <form action={addMessage} className="mt-6 flex gap-2">
            <input
              name="note"
              className="input flex-1"
              placeholder="Add a message…"
              required
            />
            <button type="submit" className="btn-secondary">Send</button>
          </form>
        )}
      </div>
    </div>
  );
}

function TradeSide({
  label,
  businessName,
  businessColor,
  serviceTitle,
  serviceId,
  qty,
  unit,
  value,
}: {
  label: string;
  businessName: string;
  businessColor: string;
  serviceTitle: string;
  serviceId: string;
  qty: number;
  unit: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <Avatar name={businessName} color={businessColor} size={22} />
        <span className="truncate text-xs text-gray-500">{businessName}</span>
      </div>
      <Link href={`/services/${serviceId}`} className="mt-2 block font-semibold text-gray-900 hover:text-brand-700">
        {serviceTitle}
      </Link>
      <p className="mt-1 text-sm text-gray-500">
        {qty} {unit}
      </p>
      <p className="mt-2 text-lg font-bold text-brand-700">{formatCurrency(value)}</p>
    </div>
  );
}
