import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Avatar, PriceTag, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/value";

export const dynamic = "force-dynamic";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      services: { where: { active: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!business) notFound();

  const completed = await prisma.swapProposal.count({
    where: {
      status: "COMPLETED",
      OR: [{ initiatorId: id }, { recipientId: id }],
    },
  });

  const isMe = session?.sub === id;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/services" className="text-sm text-brand-700 hover:underline">
        ← Back to services
      </Link>

      {/* Header */}
      <div className="card mt-3 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={business.name} color={business.logoColor} size={72} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.tagline && <p className="text-gray-600">{business.tagline}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {business.industry && <span>🏷 {business.industry}</span>}
                {business.location && <span>📍 {business.location}</span>}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                    🔗 Website
                  </a>
                )}
                <span>✓ {completed} completed swap{completed === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>
          {isMe && (
            <Link href="/profile" className="btn-secondary">Edit profile</Link>
          )}
        </div>

        {business.bio && (
          <p className="mt-5 whitespace-pre-wrap border-t border-gray-100 pt-5 text-gray-700">
            {business.bio}
          </p>
        )}
      </div>

      {/* Services */}
      <h2 className="mt-8 text-lg font-semibold text-gray-900">
        Services offered ({business.services.length})
      </h2>
      <div className="mt-4">
        {business.services.length === 0 ? (
          <EmptyState
            title="No active services"
            description={`${business.name} hasn't listed any services yet.`}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {business.services.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.id}`}
                className="card flex flex-col p-5 transition hover:border-brand-300 hover:shadow-md"
              >
                <span className="badge w-fit bg-brand-50 text-brand-700">{s.category}</span>
                <h3 className="mt-2 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-600">{s.description}</p>
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <PriceTag pricingModel={s.pricingModel} hourlyRate={s.hourlyRate} fixedValue={s.fixedValue} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!session && (
        <div className="mt-8 rounded-xl bg-brand-600 p-6 text-center text-white">
          <p className="font-semibold">Want to swap with {business.name}?</p>
          <p className="mt-1 text-sm text-brand-100">Create your profile and propose a trade.</p>
          <Link href="/register" className="btn mt-4 bg-white text-brand-700 hover:bg-brand-50">
            Get started free
          </Link>
        </div>
      )}
    </div>
  );
}
