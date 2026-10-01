import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createServiceAction } from "@/lib/actions/serviceActions";
import ServiceForm from "@/components/ServiceForm";

export default async function NewServicePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm text-brand-700 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">List a service</h1>
      <p className="mt-1 text-sm text-gray-500">
        Describe what you offer and set its value. This is what other businesses
        will swap for.
      </p>

      <div className="card mt-6 p-6">
        <ServiceForm action={createServiceAction} submitLabel="Publish service" />
      </div>
    </div>
  );
}
