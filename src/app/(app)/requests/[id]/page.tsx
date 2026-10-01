import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Avatar, StatusBadge, EmptyState } from "@/components/ui";
import ProposeSwapForm from "@/components/ProposeSwapForm";
import SwapCard from "@/components/SwapCard";
import { closeRequestAction } from "@/lib/actions/requestActions";
import { formatCurrency } from "@/lib/value";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: {
        include: { services: { where: { active: true }, orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!request) notFound();

  const isRequester = session?.sub === request.requesterId;

  // Offers = swap proposals linked to this request (requester is the recipient).
  const offers = isRequester
    ? await prisma.swapProposal.findMany({
        where: { requestId: request.id },
        include: {
          offeredService: true,
          requestedService: true,
          initiator: true,
          recipient: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // If the viewer already sent an offer, link to it instead of the form.
  const myExistingOffer =
    session && !isRequester
      ? await prisma.swapProposal.findFirst({
          where: { requestId: request.id, initiatorId: session.sub },
        })
      : null;

  // The viewer's active services (what they'd give to fulfill the need).
  const myServices =
    session && !isRequester
      ? await prisma.service.findMany({
          where: { businessId: session.sub, active: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/requests" className="text-sm text-brand-700 hover:underline">
        ← Back to requests
      </Link>

      {/* Request */}
      <div className="card mt-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="badge bg-amber-50 text-amber-800">{request.category}</span>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">{request.title}</h1>
          </div>
          <div className="text-right">
            {request.status !== "OPEN" ? (
              <StatusBadge status={request.status === "FULFILLED" ? "COMPLETED" : "DECLINED"} />
            ) : request.estimatedValue > 0 ? (
              <span className="text-lg font-bold text-brand-700">
                ~{formatCurrency(request.estimatedValue)}
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-gray-700">{request.description}</p>

        {request.offering && (
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="font-medium text-gray-700">Offering in return:</span>{" "}
            <span className="text-gray-600">{request.offering}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <Link href={`/businesses/${request.requester.id}`} className="flex items-center gap-2 hover:opacity-90">
            <Avatar name={request.requester.name} color={request.requester.logoColor} size={32} />
            <span className="text-sm font-medium text-gray-700">{request.requester.name}</span>
          </Link>
          {isRequester && (
            <form action={closeRequestAction.bind(null, request.id)}>
              <button type="submit" className="btn-ghost text-sm">
                {request.status === "CLOSED" ? "Reopen request" : "Close request"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Requester's view: received offers */}
      {isRequester ? (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            Offers received
            {offers.length > 0 && <span className="badge bg-brand-600 text-white">{offers.length}</span>}
          </h2>
          {offers.length === 0 ? (
            <div className="card p-6 text-sm text-gray-500">
              No offers yet. Share your request or browse services to invite trades.
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((swap) => (
                <SwapCard key={swap.id} swap={swap} currentBusinessId={request.requesterId} />
              ))}
            </div>
          )}
        </div>
      ) : !session ? (
        <div className="card mt-8 p-6 text-center">
          <p className="text-sm text-gray-600">Sign in to send an offer.</p>
          <Link href="/login" className="btn-primary mt-3">Sign in</Link>
        </div>
      ) : request.status !== "OPEN" ? (
        <div className="card mt-8 p-6 text-sm text-gray-600">
          This request is {request.status.toLowerCase()} and isn&apos;t taking offers.
        </div>
      ) : myExistingOffer ? (
        <div className="card mt-8 p-6">
          <p className="text-sm text-gray-600">You&apos;ve already sent an offer for this request.</p>
          <Link href={`/swaps/${myExistingOffer.id}`} className="btn-secondary mt-3">
            View your offer
          </Link>
        </div>
      ) : (
        <div className="card mt-8 p-6">
          <h2 className="font-semibold text-gray-900">Send an offer</h2>
          <p className="mt-1 text-sm text-gray-500">
            Offer a service to fulfill this request, and pick what you&apos;d like
            in return. Add cash if the trade needs balancing.
          </p>
          <div className="mt-4">
            {request.requester.services.length === 0 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                {request.requester.name} hasn&apos;t listed any services to trade back
                yet, so there&apos;s nothing to receive in return right now.
              </div>
            ) : (
              <ProposeSwapForm
                counterpartyName={request.requester.name}
                requestId={request.id}
                submitLabel="Send offer"
                myServices={myServices.map((s) => ({
                  id: s.id,
                  title: s.title,
                  pricingModel: s.pricingModel,
                  hourlyRate: s.hourlyRate,
                  fixedValue: s.fixedValue,
                }))}
                requestables={request.requester.services.map((s) => ({
                  id: s.id,
                  title: s.title,
                  pricingModel: s.pricingModel,
                  hourlyRate: s.hourlyRate,
                  fixedValue: s.fixedValue,
                }))}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
