import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, PriceTag, StatusBadge, EmptyState } from "@/components/ui";
import SwapCard from "@/components/SwapCard";
import { formatCurrency } from "@/lib/value";
import { toggleServiceActiveAction } from "@/lib/actions/serviceActions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const { tab = "overview" } = await searchParams;
  const me = business.id;

  const [services, incoming, recentSwaps, counts] = await Promise.all([
    prisma.service.findMany({
      where: { businessId: me },
      orderBy: { createdAt: "desc" },
    }),
    prisma.swapProposal.findMany({
      where: { recipientId: me, status: "PENDING" },
      include: {
        offeredService: true,
        requestedService: true,
        initiator: true,
        recipient: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.swapProposal.findMany({
      where: { OR: [{ initiatorId: me }, { recipientId: me }] },
      include: {
        offeredService: true,
        requestedService: true,
        initiator: true,
        recipient: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.swapProposal.groupBy({
      by: ["status"],
      where: { OR: [{ initiatorId: me }, { recipientId: me }] },
      _count: true,
    }),
  ]);

  const countBy = (s: string) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  const completedValue = await prisma.swapProposal.aggregate({
    where: { status: "COMPLETED", OR: [{ initiatorId: me }, { recipientId: me }] },
    _sum: { offeredValue: true },
  });

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "services", label: `My services (${services.length})` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar name={business.name} color={business.logoColor} size={56} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-sm text-gray-500">
              {business.tagline || "Add a tagline in your profile"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/profile" className="btn-secondary">Edit profile</Link>
          <Link href="/services/new" className="btn-primary">+ List a service</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active services" value={services.filter((s) => s.active).length} />
        <StatCard label="Pending" value={countBy("PENDING")} accent />
        <StatCard label="In progress" value={countBy("ACCEPTED")} />
        <StatCard label="Completed" value={countBy("COMPLETED")} />
      </div>
      {completedValue._sum.offeredValue ? (
        <p className="mt-3 text-sm text-gray-500">
          You&apos;ve traded{" "}
          <span className="font-semibold text-brand-700">
            {formatCurrency(completedValue._sum.offeredValue)}
          </span>{" "}
          of value in completed swaps — cash you didn&apos;t have to spend.
        </p>
      ) : null}

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "services" ? (
        <div className="mt-6">
          {services.length === 0 ? (
            <EmptyState
              title="No services yet"
              description="List your first service so other businesses can swap for it."
              action={<Link href="/services/new" className="btn-primary">List a service</Link>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <span className="badge bg-brand-50 text-brand-700">{s.category}</span>
                    {!s.active && <span className="badge bg-gray-100 text-gray-600">Inactive</span>}
                  </div>
                  <Link href={`/services/${s.id}`} className="mt-2 block font-semibold text-gray-900 hover:text-brand-700">
                    {s.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{s.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <PriceTag pricingModel={s.pricingModel} hourlyRate={s.hourlyRate} fixedValue={s.fixedValue} />
                    <div className="flex gap-2">
                      <Link href={`/services/${s.id}/edit`} className="text-sm text-brand-700 hover:underline">Edit</Link>
                      <form action={toggleServiceActiveAction.bind(null, s.id)}>
                        <button type="submit" className="text-sm text-gray-500 hover:underline">
                          {s.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {/* Incoming proposals */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              Incoming proposals
              {incoming.length > 0 && (
                <span className="badge bg-brand-600 text-white">{incoming.length}</span>
              )}
            </h2>
            {incoming.length === 0 ? (
              <div className="card p-6 text-sm text-gray-500">
                No pending proposals right now.
              </div>
            ) : (
              <div className="space-y-4">
                {incoming.map((swap) => (
                  <SwapCard key={swap.id} swap={swap} currentBusinessId={me} />
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent swaps</h2>
              <Link href="/swaps" className="text-sm text-brand-700 hover:underline">View all</Link>
            </div>
            {recentSwaps.length === 0 ? (
              <div className="card p-6 text-sm text-gray-500">
                No swaps yet.{" "}
                <Link href="/services" className="font-medium text-brand-700 hover:underline">
                  Browse services
                </Link>{" "}
                to start one.
              </div>
            ) : (
              <div className="space-y-4">
                {recentSwaps.map((swap) => (
                  <SwapCard key={swap.id} swap={swap} currentBusinessId={me} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent && value > 0 ? "ring-1 ring-brand-200" : ""}`}>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}
