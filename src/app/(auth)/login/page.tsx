"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/lib/actions/authActions";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">Sign in to manage your swaps.</p>

      {state.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" placeholder="you@business.com" required />
          {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" required />
          {state.fieldErrors?.password && <p className="field-error">{state.fieldErrors.password}</p>}
        </div>
        <SubmitButton className="btn-primary w-full py-2.5" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Create a business profile
        </Link>
      </p>
    </div>
  );
}
