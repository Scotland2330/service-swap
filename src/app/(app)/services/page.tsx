import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { Avatar, PriceTag, EmptyState } from "@/components/ui";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BrowseServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const session = await getSession();

  const where: Prisma.ServiceWhereInput = { active: true };
  if (category && category !== "all") where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { business: { name: { contains: q } } },
    ];
  }

  const services = await prisma.service.findMany({
    where,
    include: { business: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse services</h1>
          <p className="mt-1 text-sm text-gray-500">
            Find a service you need, then offer one of yours in return.
          </p>
        </div>
        {session && (
          <Link href="/services/new" className="btn-primary">
            + List a service
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          className="input sm:max-w-sm"
          placeholder="Search services or businesses…"
        />
        <select name="category" defaultValue={category ?? "all"} className="input sm:max-w-xs">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {/* Results */}
      <div className="mt-6">
        {services.length === 0 ? (
          <EmptyState
            title="No services found"
            description="Try a different search or category. Or be the first to list a service in this space."
            action={
              session ? (
                <Link href="/services/new" className="btn-primary">List a service</Link>
              ) : (
                <Link href="/register" className="btn-primary">Get started</Link>
              )
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {services.length} service{services.length === 1 ? "" : "s"} available
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <Link
                  key={s.id}
                  href={`/services/${s.id}`}
                  className="card flex flex-col p-5 transition hover:border-brand-300 hover:shadow-md"
                >
                  <span className="badge w-fit bg-brand-50 text-brand-700">{s.category}</span>
                  <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-600">
                    {s.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.business.name} color={s.business.logoColor} size={28} />
                      <span className="text-sm text-gray-600">{s.business.name}</span>
                    </div>
                    <PriceTag
                      pricingModel={s.pricingModel}
                      hourlyRate={s.hourlyRate}
                      fixedValue={s.fixedValue}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
