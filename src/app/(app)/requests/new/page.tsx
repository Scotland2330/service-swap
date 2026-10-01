import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RequestForm from "@/components/RequestForm";

export default async function NewRequestPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/requests" className="text-sm text-brand-700 hover:underline">
        ← Back to requests
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Post a request</h1>
      <p className="mt-1 text-sm text-gray-500">
        Describe what you need. Other businesses will send offers to fulfill it —
        in trade, or trade plus a little cash.
      </p>

      <div className="card mt-6 p-6">
        <RequestForm />
      </div>
    </div>
  );
}
