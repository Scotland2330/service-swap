"use client";

import { useActionState } from "react";
import { createRequestAction, type RequestFormState } from "@/lib/actions/requestActions";
import { CATEGORIES } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

export default function RequestForm() {
  const [state, action] = useActionState<RequestFormState, FormData>(
    createRequestAction,
    {}
  );

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="label" htmlFor="title">What do you need?</label>
        <input
          id="title" name="title" className="input"
          placeholder="e.g. A logo and brand kit for our launch"
          required
        />
        {state.fieldErrors?.title && <p className="field-error">{state.fieldErrors.title}</p>}
      </div>

      <div>
        <label className="label" htmlFor="category">Category</label>
        <select id="category" name="category" className="input" defaultValue="" required>
          <option value="" disabled>Select a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {state.fieldErrors?.category && <p className="field-error">{state.fieldErrors.category}</p>}
      </div>

      <div>
        <label className="label" htmlFor="description">Details</label>
        <textarea
          id="description" name="description" rows={4} className="input"
          placeholder="Scope, timeline, must-haves, and anything a good match should know."
          required
        />
        {state.fieldErrors?.description && <p className="field-error">{state.fieldErrors.description}</p>}
      </div>

      <div>
        <label className="label" htmlFor="estimatedValue">Roughly what is this worth? (USD, optional)</label>
        <div className="relative max-w-[200px]">
          <span className="pointer-events-none absolute left-3 top-2 text-gray-400">$</span>
          <input
            id="estimatedValue" name="estimatedValue" type="number" min="0" step="1"
            className="input pl-7" placeholder="1500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Helps others size a fair offer. You can still negotiate.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="offering">What can you offer in return? (optional)</label>
        <input
          id="offering" name="offering" className="input"
          placeholder="e.g. Bookkeeping, some cash to top up, or a mix"
        />
      </div>

      <SubmitButton className="btn-primary" pendingText="Posting…">Post request</SubmitButton>
    </form>
  );
}
