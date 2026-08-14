"use client";

import { useActionState, useMemo, useState } from "react";
import { createProposalAction, type SwapFormState } from "@/lib/actions/swapActions";
import { serviceValue, computeBalance, formatCurrency, unitLabel } from "@/lib/value";
import SubmitButton from "@/components/SubmitButton";

export interface MyService {
  id: string;
  title: string;
  pricingModel: string;
  hourlyRate: number;
  fixedValue: number;
}

export interface RequestedService {
  id: string;
  title: string;
  pricingModel: string;
  hourlyRate: number;
  fixedValue: number;
  businessName: string;
}

export default function ProposeSwapForm({
  myServices,
  requested,
}: {
  myServices: MyService[];
  requested: RequestedService;
}) {
  const [state, action] = useActionState<SwapFormState, FormData>(
    createProposalAction,
    {}
  );

  const [offeredId, setOfferedId] = useState(myServices[0]?.id ?? "");
  const [offeredQty, setOfferedQty] = useState(1);
  const [requestedQty, setRequestedQty] = useState(1);

  const offered = myServices.find((s) => s.id === offeredId);

  const offeredValue = offered ? serviceValue(offered, offeredQty) : 0;
  const requestedValue = serviceValue(requested, requestedQty);
  const balance = useMemo(
    () => computeBalance(offeredValue, requestedValue),
    [offeredValue, requestedValue]
  );

  const barColor =
    balance.status === "balanced"
      ? "bg-brand-500"
      : balance.fairnessPct >= 70
      ? "bg-amber-400"
      : "bg-red-400";

  if (myServices.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        You need at least one active service to offer before you can propose a
        swap.{" "}
        <a href="/services/new" className="font-semibold underline">
          List a service first.
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <input type="hidden" name="requestedServiceId" value={requested.id} />
      <input type="hidden" name="offeredServiceId" value={offeredId} />
      <input type="hidden" name="offeredQty" value={offeredQty} />
      <input type="hidden" name="requestedQty" value={requestedQty} />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* You give */}
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            You give
          </p>
          <select
            className="input mt-2"
            value={offeredId}
            onChange={(e) => setOfferedId(e.target.value)}
          >
            {myServices.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number" min="0.5" step="0.5"
              className="input w-24"
              value={offeredQty}
              onChange={(e) => setOfferedQty(Math.max(0, Number(e.target.value)))}
            />
            <span className="text-sm text-gray-500">
              {offered ? unitLabel(offered.pricingModel, offeredQty) : ""}
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-brand-700">
            {formatCurrency(offeredValue)}
          </p>
        </div>

        {/* You get */}
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            You get
          </p>
          <p className="mt-2 truncate rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800">
            {requested.title}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number" min="0.5" step="0.5"
              className="input w-24"
              value={requestedQty}
              onChange={(e) => setRequestedQty(Math.max(0, Number(e.target.value)))}
            />
            <span className="text-sm text-gray-500">
              {unitLabel(requested.pricingModel, requestedQty)}
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-brand-700">
            {formatCurrency(requestedValue)}
          </p>
        </div>
      </div>

      {/* Balance meter */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Trade balance</span>
          <span
            className={`badge ${
              balance.status === "balanced"
                ? "bg-brand-100 text-brand-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {balance.fairnessPct}% balanced
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${balance.fairnessPct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">{balance.label}</p>
      </div>

      <div>
        <label className="label" htmlFor="message">Message (optional)</label>
        <textarea
          id="message" name="message" rows={3} className="input"
          placeholder={`Hi ${requested.businessName}, I'd love to swap services…`}
        />
      </div>

      <div>
        <label className="label" htmlFor="terms">Proposed terms (optional)</label>
        <textarea
          id="terms" name="terms" rows={2} className="input"
          placeholder="Timeline, deliverables, revisions, deadlines…"
        />
      </div>

      <SubmitButton className="btn-primary w-full py-2.5" pendingText="Sending proposal…">
        Send swap proposal
      </SubmitButton>
    </form>
  );
}
