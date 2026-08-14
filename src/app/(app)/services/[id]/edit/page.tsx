import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateServiceAction } from "@/lib/actions/serviceActions";
import ServiceForm from "@/components/ServiceForm";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();
  if (service.businessId !== session.sub) redirect("/dashboard");

  const boundAction = updateServiceAction.bind(null, service.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard?tab=services" className="text-sm text-brand-700 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Edit service</h1>

      <div className="card mt-6 p-6">
        <ServiceForm
          action={boundAction}
          submitLabel="Save changes"
          defaults={{
            title: service.title,
            description: service.description,
            category: service.category,
            pricingModel: service.pricingModel,
            hourlyRate: service.hourlyRate,
            fixedValue: service.fixedValue,
          }}
        />
      </div>
    </div>
  );
}
