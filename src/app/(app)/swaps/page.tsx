import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SwapCard from "@/components/SwapCard";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "incoming", label: "Incoming" },
  { key: "outgoing", label: "Outgoing" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default async function SwapsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { filter = "all" } = await searchParams;
  const me = session.sub;

  const baseWhere = { OR: [{ initiatorId: me }, { recipientId: me }] };
  let where: Record<string, unknown> = baseWhere;
  if (filter === "incoming") where = { recipientId: me };
  else if (filter === "outgoing") where = { initiatorId: me };
  else if (filter === "active") where = { ...baseWhere, status: { in: ["PENDING", "ACCEPTED"] } };
  else if (filter === "completed") where = { ...baseWhere, status: "COMPLETED" };

  const swaps = await prisma.swapProposal.findMany({
    where,
    include: {
      offeredService: true,
      requestedService: true,
      initiator: true,
      recipient: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Your swaps</h1>
      <p className="mt-1 text-sm text-gray-500">
        Proposals you&apos;ve sent and received.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/swaps?filter=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-brand-600 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {swaps.length === 0 ? (
          <EmptyState
            title="No swaps here yet"
            description="Browse services and propose a trade to get your first swap going."
            action={<Link href="/services" className="btn-primary">Browse services</Link>}
          />
        ) : (
          swaps.map((swap) => (
            <SwapCard key={swap.id} swap={swap} currentBusinessId={me} />
          ))
        )}
      </div>
    </div>
  );
}
