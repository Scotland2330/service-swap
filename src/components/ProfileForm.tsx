"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profileActions";
import { INDUSTRIES, LOGO_COLORS } from "@/lib/constants";
import { Avatar } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";

export interface ProfileDefaults {
  name: string;
  tagline?: string | null;
  bio?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  logoColor: string;
}

export default function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, action] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    {}
  );
  const [color, setColor] = useState(defaults.logoColor);
  const [name, setName] = useState(defaults.name);

  return (
    <form action={action} className="space-y-5">
      {state.success && (
        <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Profile saved.
        </div>
      )}
      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} color={color} size={64} />
        <div>
          <span className="label">Logo color</span>
          <div className="flex gap-2">
            {LOGO_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ${color === c ? "ring-gray-800" : "ring-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={`Choose ${c}`}
              />
            ))}
          </div>
        </div>
      </div>
      <input type="hidden" name="logoColor" value={color} />

      <div>
        <label className="label" htmlFor="name">Business name</label>
        <input
          id="name" name="name" className="input"
          value={name} onChange={(e) => setName(e.target.value)}
          required
        />
        {state.fieldErrors?.name && <p className="field-error">{state.fieldErrors.name}</p>}
      </div>

      <div>
        <label className="label" htmlFor="tagline">Tagline</label>
        <input
          id="tagline" name="tagline" className="input"
          defaultValue={defaults.tagline ?? ""}
          placeholder="One-line description of what you do"
          maxLength={120}
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">About</label>
        <textarea
          id="bio" name="bio" rows={4} className="input"
          defaultValue={defaults.bio ?? ""}
          placeholder="Tell other businesses about your work, experience, and what makes a good swap partner for you."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="industry">Industry</label>
          <select id="industry" name="industry" className="input" defaultValue={defaults.industry ?? ""}>
            <option value="">Select…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" name="location" className="input" defaultValue={defaults.location ?? ""} placeholder="City, State" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="website">Website</label>
        <input id="website" name="website" className="input" defaultValue={defaults.website ?? ""} placeholder="https://…" />
      </div>

      <SubmitButton className="btn-primary" pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}
