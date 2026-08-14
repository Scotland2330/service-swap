"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { serviceValue, suggestCash } from "@/lib/value";

export type SwapFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const proposalSchema = z.object({
  offeredServiceId: z.string().min(1, "Choose a service to offer"),
  requestedServiceId: z.string().min(1),
  offeredQty: z.coerce.number().positive("Quantity must be greater than 0"),
  requestedQty: z.coerce.number().positive("Quantity must be greater than 0"),
  cashTopUp: z.coerce.number().min(0).default(0),
  message: z.string().optional(),
  terms: z.string().optional(),
  requestId: z.string().optional(),
});

export async function createProposalAction(
  _prev: SwapFormState,
  formData: FormData
): Promise<SwapFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = proposalSchema.safeParse({
    offeredServiceId: formData.get("offeredServiceId"),
    requestedServiceId: formData.get("requestedServiceId"),
    offeredQty: formData.get("offeredQty"),
    requestedQty: formData.get("requestedQty"),
    cashTopUp: formData.get("cashTopUp") || 0,
    message: formData.get("message") || undefined,
    terms: formData.get("terms") || undefined,
    requestId: formData.get("requestId") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;
  const [offered, requested] = await Promise.all([
    prisma.service.findUnique({ where: { id: d.offeredServiceId } }),
    prisma.service.findUnique({ where: { id: d.requestedServiceId } }),
  ]);

  if (!offered || !requested) return { error: "One of the services no longer exists." };
  if (offered.businessId !== session.sub) {
    return { error: "You can only offer a service you own." };
  }
  if (requested.businessId === session.sub) {
    return { error: "You can't request your own service." };
  }
  if (!requested.active) {
    return { error: "That service is no longer available for swap." };
  }

  const offeredValue = serviceValue(offered, d.offeredQty);
  const requestedValue = serviceValue(requested, d.requestedQty);

  // Cash flows from whichever side's service is worth less. We derive the
  // payer server-side so it can't be spoofed, and only honor cash if there's
  // a real gap to cover.
  let cashTopUp = 0;
  let cashPayer = "NONE";
  if (d.cashTopUp > 0) {
    const suggestion = suggestCash(offeredValue, requestedValue);
    if (suggestion.payer !== "NONE") {
      cashPayer = suggestion.payer;
      cashTopUp = Math.round(d.cashTopUp * 100) / 100;
    }
  }

  // Validate an optional linked request.
  let requestId: string | null = null;
  if (d.requestId) {
    const req = await prisma.serviceRequest.findUnique({ where: { id: d.requestId } });
    if (req && req.status === "OPEN" && req.requesterId === requested.businessId) {
      requestId = req.id;
    }
  }

  const proposal = await prisma.swapProposal.create({
    data: {
      initiatorId: session.sub,
      recipientId: requested.businessId,
      offeredServiceId: offered.id,
      offeredQty: d.offeredQty,
      offeredValue,
      requestedServiceId: requested.id,
      requestedQty: d.requestedQty,
      requestedValue,
      cashTopUp,
      cashPayer,
      requestId,
      message: d.message || null,
      terms: d.terms || null,
      status: "PENDING",
      events: {
        create: {
          actorId: session.sub,
          actorName: session.name,
          kind: "CREATED",
          note: d.message || null,
        },
      },
    },
  });

  revalidatePath("/swaps");
  revalidatePath("/dashboard");
  if (requestId) revalidatePath(`/requests/${requestId}`);
  redirect(`/swaps/${proposal.id}`);
}

type Decision = "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";

async function transition(proposalId: string, decision: Decision, note?: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const proposal = await prisma.swapProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return { error: "Proposal not found." };

  const isInitiator = proposal.initiatorId === session.sub;
  const isRecipient = proposal.recipientId === session.sub;
  if (!isInitiator && !isRecipient) return { error: "Not authorized." };

  // Permission + state matrix.
  const allowed: Record<Decision, boolean> = {
    // Only the recipient can accept/decline a pending proposal.
    ACCEPTED: isRecipient && proposal.status === "PENDING",
    DECLINED: isRecipient && proposal.status === "PENDING",
    // The initiator can withdraw a pending proposal.
    CANCELLED: isInitiator && proposal.status === "PENDING",
    // Either party can mark an accepted swap complete.
    COMPLETED: (isInitiator || isRecipient) && proposal.status === "ACCEPTED",
  };

  if (!allowed[decision]) {
    return { error: "That action isn't available for this proposal right now." };
  }

  await prisma.swapProposal.update({
    where: { id: proposalId },
    data: {
      status: decision,
      events: {
        create: {
          actorId: session.sub,
          actorName: session.name,
          kind: decision,
          note: note || null,
        },
      },
    },
  });

  // Accepting an offer on a posted request marks that request fulfilled.
  if (decision === "ACCEPTED" && proposal.requestId) {
    await prisma.serviceRequest.update({
      where: { id: proposal.requestId },
      data: { status: "FULFILLED" },
    });
    revalidatePath(`/requests/${proposal.requestId}`);
    revalidatePath("/requests");
  }

  revalidatePath(`/swaps/${proposalId}`);
  revalidatePath("/swaps");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function acceptProposalAction(proposalId: string) {
  return transition(proposalId, "ACCEPTED");
}
export async function declineProposalAction(proposalId: string) {
  return transition(proposalId, "DECLINED");
}
export async function cancelProposalAction(proposalId: string) {
  return transition(proposalId, "CANCELLED");
}
export async function completeProposalAction(proposalId: string) {
  return transition(proposalId, "COMPLETED");
}

export async function addProposalMessageAction(
  proposalId: string,
  formData: FormData
) {
  const session = await getSession();
  if (!session) redirect("/login");
  const body = String(formData.get("note") || "").trim();
  if (!body) return;

  const proposal = await prisma.swapProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return;
  if (proposal.initiatorId !== session.sub && proposal.recipientId !== session.sub) return;

  await prisma.proposalEvent.create({
    data: {
      proposalId,
      actorId: session.sub,
      actorName: session.name,
      kind: "MESSAGE",
      note: body,
    },
  });
  revalidatePath(`/swaps/${proposalId}`);
}
