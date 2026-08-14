"use client";

import { useState, useTransition } from "react";
import {
  acceptProposalAction,
  declineProposalAction,
  cancelProposalAction,
  completeProposalAction,
} from "@/lib/actions/swapActions";

type ActionResult = { error?: string; ok?: boolean } | undefined;

export default function SwapActions({
  proposalId,
  status,
  isInitiator,
  isRecipient,
}: {
  proposalId: string;
  status: string;
  isInitiator: boolean;
  isRecipient: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: (id: string) => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const res = await fn(proposalId);
      if (res?.error) setError(res.error);
    });
  }

  const buttons: React.ReactNode[] = [];

  if (status === "PENDING" && isRecipient) {
    buttons.push(
      <button key="accept" disabled={pending} onClick={() => run(acceptProposalAction)} className="btn-primary">
        Accept swap
      </button>,
      <button key="decline" disabled={pending} onClick={() => run(declineProposalAction)} className="btn-danger">
        Decline
      </button>
    );
  }
  if (status === "PENDING" && isInitiator) {
    buttons.push(
      <button key="cancel" disabled={pending} onClick={() => run(cancelProposalAction)} className="btn-danger">
        Withdraw proposal
      </button>
    );
  }
  if (status === "ACCEPTED") {
    buttons.push(
      <button key="complete" disabled={pending} onClick={() => run(completeProposalAction)} className="btn-primary">
        Mark as completed
      </button>
    );
  }

  if (buttons.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-3">{buttons}</div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
