"use client";

import { useActionState, useState } from "react";
import type { ServiceFormState } from "@/lib/actions/serviceActions";
import { CATEGORIES } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

type Action = (
  prev: ServiceFormState,
  formData: FormData
) => Promise<ServiceFormState>;

export interface ServiceDefaults {
  title?: string;
  description?: string;
  category?: string;
  pricingModel?: string;
  hourlyRate?: number;
  fixedValue?: number;
}

export default function ServiceForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults?: ServiceDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [model, setModel] = useState(defaults?.pricingModel ?? "HOURLY");

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="label" htmlFor="title">Service title</label>
        <input
          id="title" name="title" className="input"
          defaultValue={defaults?.title}
          placeholder="e.g. Brand logo & identity design"
          required
        />
        {state.fieldErrors?.title && <p className="field-error">{state.fieldErrors.title}</p>}
      </div>

      <div>
        <label className="label" htmlFor="category">Category</label>
        <select
          id="category" name="category" className="input"
          defaultValue={defaults?.category ?? ""}
          required
        >
          <option value="" disabled>Select a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {state.fieldErrors?.category && <p className="field-error">{state.fieldErrors.category}</p>}
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description" name="description" rows={4} className="input"
          defaultValue={defaults?.description}
          placeholder="What's included, your experience, turnaround time…"
          required
        />
        {state.fieldErrors?.description && <p className="field-error">{state.fieldErrors.description}</p>}
      </div>

      <div>
        <span className="label">How do you value this service?</span>
        <div className="grid grid-cols-2 gap-3">
          <label className={`cursor-pointer rounded-lg border p-3 text-sm ${model === "HOURLY" ? "border-brand-500 bg-brand-50" : "border-gray-300"}`}>
            <input
              type="radio" name="pricingModel" value="HOURLY"
              checked={model === "HOURLY"}
              onChange={() => setModel("HOURLY")}
              className="sr-only"
            />
            <span className="font-semibold text-gray-900">Hourly rate</span>
            <span className="mt-1 block text-xs text-gray-500">Value = rate × hours</span>
          </label>
          <label className={`cursor-pointer rounded-lg border p-3 text-sm ${model === "FIXED" ? "border-brand-500 bg-brand-50" : "border-gray-300"}`}>
            <input
              type="radio" name="pricingModel" value="FIXED"
              checked={model === "FIXED"}
              onChange={() => setModel("FIXED")}
              className="sr-only"
            />
            <span className="font-semibold text-gray-900">Fixed project</span>
            <span className="mt-1 block text-xs text-gray-500">One set value per project</span>
          </label>
        </div>
      </div>

      {model === "HOURLY" ? (
        <div>
          <label className="label" htmlFor="hourlyRate">Hourly rate (USD)</label>
          <div className="relative max-w-[200px]">
            <span className="pointer-events-none absolute left-3 top-2 text-gray-400">$</span>
            <input
              id="hourlyRate" name="hourlyRate" type="number" min="0" step="1"
              className="input pl-7"
              defaultValue={defaults?.hourlyRate || ""}
              placeholder="75"
            />
          </div>
          {state.fieldErrors?.hourlyRate && <p className="field-error">{state.fieldErrors.hourlyRate}</p>}
          <input type="hidden" name="fixedValue" value="0" />
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="fixedValue">Project value (USD)</label>
          <div className="relative max-w-[200px]">
            <span className="pointer-events-none absolute left-3 top-2 text-gray-400">$</span>
            <input
              id="fixedValue" name="fixedValue" type="number" min="0" step="1"
              className="input pl-7"
              defaultValue={defaults?.fixedValue || ""}
              placeholder="1500"
            />
          </div>
          {state.fieldErrors?.fixedValue && <p className="field-error">{state.fieldErrors.fixedValue}</p>}
          <input type="hidden" name="hourlyRate" value="0" />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <SubmitButton className="btn-primary" pendingText="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
