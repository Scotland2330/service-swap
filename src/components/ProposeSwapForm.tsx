"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createProposalAction, type SwapFormState } from "@/lib/actions/swapActions";
import {
  serviceValue,
  computeBalance,
  suggestCash,
  formatCurrency,
  unitLabel,
} from "@/lib/value";
import SubmitButton from "@/components/SubmitButton";

export interface ServiceOption {
  id: string;
  title: string;
  pricingModel: string;
  hourlyRate: number;
  fixedValue: number;
}

export default function ProposeSwapForm({
  myServices,
  requestables,
  counterpartyName,
  requestId,
  submitLabel = "Send swap proposal",
}: {
  myServices: ServiceOption[];
  /** Services the counterparty offers — what you'd receive. One or many. */
  requestables: ServiceOption[];
  counterpartyName: string;
  requestId?: string;
  submitLabel?: string;
}) {
  const [state, action] = useActionState<SwapFormState, FormData>(
    createProposalAction,
    {}
  );

  const [offeredId, setOfferedId] = useState(myServices[0]?.id ?? "");
  const [requestedId, setRequestedId] = useState(requestables[0]?.id ?? "");
  const [offeredQty, setOfferedQty] = useState(1);
  const [requestedQty, setRequestedQty] = useState(1);
  const [cash, setCash] = useState(0);
  const [cashTouched, setCashTouched] = useState(false);

  const offered = myServices.find((s) => s.id === offeredId);
  const requested = requestables.find((s) => s.id === requestedId);

  const offeredValue = offered ? serviceValue(offered, offeredQty) : 0;
  const requestedValue = requested ? serviceValue(requested, requestedQty) : 0;

  const suggestion = useMemo(
    () => suggestCash(offeredValue, requestedValue),
    [offeredValue, requestedValue]
  );

  // Until the user touches the cash field, keep it pinned to the amount that
  // would balance the trade — so "pay a little to make it happen" is one click.
  useEffect(() => {
    if (!cashTouched) setCash(Math.round(suggestion.amount));
  }, [suggestion.amount, cashTouched]);

  const balance = useMemo(
    () => computeBalance(offeredValue, requestedValue, cash, suggestion.payer),
    [offeredValue, requestedValue, cash, suggestion.payer]
  );

  const barColor =
    balance.status === "balanced"
      ? "bg-brand-500"
      : balance.fairnessPct >= 70
      ? "bg-amber-400"
      : "bg-red-400";

  const iPayCash = suggestion.payer === "INITIATOR";
  const theyPayCash = suggestion.payer === "RECIPIENT";

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

  if (requestables.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        {counterpartyName} hasn&apos;t listed a service you can trade for yet, so
        there&apos;s nothing to receive in return.
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

      <input type="hidden" name="requestedServiceId" value={requestedId} />
      <input type="hidden" name="offeredServiceId" value={offeredId} />
      <input type="hidden" name="offeredQty" value={offeredQty} />
      <input type="hidden" name="requestedQty" value={requestedQty} />
      <input type="hidden" name="cashTopUp" value={cash} />
      {requestId && <input type="hidden" name="requestId" value={requestId} />}

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
            {iPayCash && cash > 0 && (
              <span className="ml-1 text-sm font-medium text-gray-500">
                + {formatCurrency(cash)} cash
              </span>
            )}
          </p>
        </div>

        {/* You get */}
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            You get
          </p>
          {requestables.length === 1 ? (
            <p className="mt-2 truncate rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800">
              {requested?.title}
            </p>
          ) : (
            <select
              className="input mt-2"
              value={requestedId}
              onChange={(e) => setRequestedId(e.target.value)}
            >
              {requestables.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          )}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number" min="0.5" step="0.5"
              className="input w-24"
              value={requestedQty}
              onChange={(e) => setRequestedQty(Math.max(0, Number(e.target.value)))}
            />
            <span className="text-sm text-gray-500">
              {requested ? unitLabel(requested.pricingModel, requestedQty) : ""}
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-brand-700">
            {formatCurrency(requestedValue)}
            {theyPayCash && cash > 0 && (
              <span className="ml-1 text-sm font-medium text-gray-500">
                + {formatCurrency(cash)} cash
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Cash top-up */}
      {suggestion.payer !== "NONE" && (
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">
              {iPayCash
                ? "Add cash to cover your side of the gap"
                : `Ask ${counterpartyName} to add cash to even it out`}
            </p>
            <span className="text-xs text-gray-500">
              Gap: {formatCurrency(suggestion.amount)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="relative w-36">
              <span className="pointer-events-none absolute left-3 top-2 text-gray-400">$</span>
              <input
                type="number" min="0" step="1"
                className="input pl-7"
                value={cash}
                onChange={(e) => {
                  setCashTouched(true);
                  setCash(Math.max(0, Number(e.target.value)));
                }}
              />
            </div>
            <button
              type="button"
              className="btn-secondary py-1.5 text-xs"
              onClick={() => {
                setCashTouched(true);
                setCash(Math.round(suggestion.amount));
              }}
            >
              Balance it ({formatCurrency(suggestion.amount)})
            </button>
            {cash > 0 && (
              <button
                type="button"
                className="btn-ghost py-1.5 text-xs"
                onClick={() => {
                  setCashTouched(true);
                  setCash(0);
                }}
              >
                No cash — trade only
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {iPayCash
              ? "You pay this on top of your service to make the trade fair."
              : "They pay this on top of their service. Handy if their service is worth less than yours."}
          </p>
        </div>
      )}

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
        <p className="mt-2 text-sm text-gray-600">
          {formatCurrency(balance.offeredTotal)} for {formatCurrency(balance.requestedTotal)} — {balance.label}
        </p>
      </div>

      <div>
        <label className="label" htmlFor="message">Message (optional)</label>
        <textarea
          id="message" name="message" rows={3} className="input"
          placeholder={`Hi ${counterpartyName}, I'd love to swap services…`}
        />
      </div>

      <div>
        <label className="label" htmlFor="terms">Proposed terms (optional)</label>
        <textarea
          id="terms" name="terms" rows={2} className="input"
          placeholder="Timeline, deliverables, revisions, deadlines…"
        />
      </div>

      <SubmitButton className="btn-primary w-full py-2.5" pendingText="Sending…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
