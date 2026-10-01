"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type FormState } from "@/lib/actions/authActions";
import { INDUSTRIES } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, initial);

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-gray-900">Create your business profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        Join and start trading services with other founders.
      </p>

      {state.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Business name</label>
          <input id="name" name="name" className="input" placeholder="Acme Studio" required />
          {state.fieldErrors?.name && <p className="field-error">{state.fieldErrors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" className="input" placeholder="you@business.com" required />
          {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" placeholder="At least 8 characters" required />
          {state.fieldErrors?.password && <p className="field-error">{state.fieldErrors.password}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="industry">Industry</label>
            <select id="industry" name="industry" className="input" defaultValue="">
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" name="location" className="input" placeholder="Austin, TX" />
          </div>
        </div>

        <SubmitButton className="btn-primary w-full py-2.5" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
