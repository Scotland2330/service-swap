import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { Avatar, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/value";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const session = await getSession();

  const where: Prisma.ServiceRequestWhereInput = { status: "OPEN" };
  if (category && category !== "all") where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { requester: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const requests = await prisma.serviceRequest.findMany({
    where,
    include: {
      requester: true,
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Businesses looking for help. Send an offer to fulfill one.
          </p>
        </div>
        {session && (
          <Link href="/requests/new" className="btn-primary">+ Post a request</Link>
        )}
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" method="get">
        <input
          name="q" defaultValue={q ?? ""}
          className="input sm:max-w-sm"
          placeholder="Search requests…"
        />
        <select name="category" defaultValue={category ?? "all"} className="input sm:max-w-xs">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="mt-6">
        {requests.length === 0 ? (
          <EmptyState
            title="No open requests"
            description="Nobody's asking for this yet. Post a request and let offers come to you."
            action={
              session ? (
                <Link href="/requests/new" className="btn-primary">Post a request</Link>
              ) : (
                <Link href="/register" className="btn-primary">Get started</Link>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/requests/${r.id}`}
                className="card flex flex-col p-5 transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="badge bg-amber-50 text-amber-800">{r.category}</span>
                  {r.estimatedValue > 0 && (
                    <span className="text-sm font-semibold text-brand-700">
                      ~{formatCurrency(r.estimatedValue)}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{r.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-600">{r.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.requester.name} color={r.requester.logoColor} size={28} />
                    <span className="text-sm text-gray-600">{r.requester.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {r._count.proposals} offer{r._count.proposals === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
