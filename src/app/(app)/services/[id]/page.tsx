import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Avatar, PriceTag } from "@/components/ui";
import ProposeSwapForm from "@/components/ProposeSwapForm";
import { toggleServiceActiveAction, deleteServiceAction } from "@/lib/actions/serviceActions";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const service = await prisma.service.findUnique({
    where: { id },
    include: { business: true },
  });
  if (!service) notFound();

  const isOwner = session?.sub === service.businessId;

  const myServices = session && !isOwner
    ? await prisma.service.findMany({
        where: { businessId: session.sub, active: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Link href="/services" className="text-sm text-brand-700 hover:underline">
          ← Back to services
        </Link>

        <div className="card mt-3 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="badge bg-brand-50 text-brand-700">{service.category}</span>
              <h1 className="mt-3 text-2xl font-bold text-gray-900">{service.title}</h1>
            </div>
            {!service.active && (
              <span className="badge bg-gray-100 text-gray-600">Inactive</span>
            )}
          </div>

          <div className="mt-4 text-2xl">
            <PriceTag
              pricingModel={service.pricingModel}
              hourlyRate={service.hourlyRate}
              fixedValue={service.fixedValue}
            />
          </div>

          <div className="mt-6 whitespace-pre-wrap text-gray-700">
            {service.description}
          </div>

          {isOwner && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-6">
              <Link href={`/services/${service.id}/edit`} className="btn-secondary">
                Edit
              </Link>
              <form action={toggleServiceActiveAction.bind(null, service.id)}>
                <button type="submit" className="btn-ghost">
                  {service.active ? "Deactivate" : "Reactivate"}
                </button>
              </form>
              <form action={deleteServiceAction.bind(null, service.id)}>
                <button type="submit" className="btn-danger">Delete</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="card p-6">
          <Link
            href={`/businesses/${service.business.id}`}
            className="flex items-center gap-3 hover:opacity-90"
          >
            <Avatar name={service.business.name} color={service.business.logoColor} size={48} />
            <div>
              <p className="font-semibold text-gray-900">{service.business.name}</p>
              {service.business.tagline && (
                <p className="text-sm text-gray-500">{service.business.tagline}</p>
              )}
            </div>
          </Link>
          {service.business.location && (
            <p className="mt-3 text-sm text-gray-500">📍 {service.business.location}</p>
          )}
        </div>

        {/* Swap CTA */}
        {!session ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-gray-600">Sign in to propose a swap.</p>
            <Link href="/login" className="btn-primary mt-3 w-full">Sign in</Link>
          </div>
        ) : isOwner ? (
          <div className="card bg-brand-50 p-6 text-sm text-brand-800">
            This is one of your own services. Share the link so others can propose
            a swap.
          </div>
        ) : !service.active ? (
          <div className="card p-6 text-sm text-gray-600">
            This service is currently inactive and can&apos;t be swapped for.
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Propose a swap</h2>
            <p className="mt-1 text-sm text-gray-500">
              Offer one of your services in return.
            </p>
            <div className="mt-4">
              <ProposeSwapForm
                myServices={myServices.map((s) => ({
                  id: s.id,
                  title: s.title,
                  pricingModel: s.pricingModel,
                  hourlyRate: s.hourlyRate,
                  fixedValue: s.fixedValue,
                }))}
                requested={{
                  id: service.id,
                  title: service.title,
                  pricingModel: service.pricingModel,
                  hourlyRate: service.hourlyRate,
                  fixedValue: service.fixedValue,
                  businessName: service.business.name,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
