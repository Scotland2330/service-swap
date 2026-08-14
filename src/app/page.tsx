import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { SwapIcon } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/value";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const [businessCount, serviceCount, completedCount] = await Promise.all([
    prisma.business.count(),
    prisma.service.count({ where: { active: true } }),
    prisma.swapProposal.count({ where: { status: "COMPLETED" } }),
  ]);

  const steps = [
    {
      title: "Create your profile",
      body: "Tell other founders what your business does and the skills you bring to the table.",
    },
    {
      title: "List your services",
      body: "Publish what you offer and set its value — an hourly rate or a fixed project price.",
    },
    {
      title: "Propose a swap",
      body: "Find a service you need, offer yours in return, and our calculator keeps the trade fair.",
    },
    {
      title: "Deliver & grow",
      body: "Accept, agree on terms, do the work, and mark it complete — no cash required.",
    },
  ];

  return (
    <div>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="badge bg-brand-100 text-brand-800">
              For bootstrapped small businesses
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
              Trade your skills instead of spending cash you don&apos;t have yet.
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              ServiceSwap is a marketplace where small businesses exchange
              services of equal value. Give what you&apos;re great at, get what you
              need, and keep your runway intact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">
                Create your business profile
              </Link>
              <Link href="/services" className="btn-secondary px-6 py-3 text-base">
                Browse services
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-brand-100 pt-8">
              <Stat label="Businesses" value={businessCount} />
              <Stat label="Services listed" value={serviceCount} />
              <Stat label="Swaps completed" value={completedCount} />
            </dl>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
          A service swap is a value-for-value trade. Here&apos;s the whole loop.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value equivalence explainer */}
      <section className="bg-brand-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Fair by design</h2>
            <p className="mt-4 text-brand-100">
              Every service carries a value. When you propose a swap, ServiceSwap
              compares both sides and shows you exactly how balanced the trade is —
              so nobody feels short-changed.
            </p>
            <Link href="/register" className="mt-6 inline-flex btn bg-white text-brand-700 hover:bg-brand-50">
              Start swapping
            </Link>
          </div>
          <div className="card bg-white p-6 text-gray-900">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-500">You give</p>
                <p className="font-semibold">10 hrs web design</p>
              </div>
              <SwapIcon className="h-6 w-6 text-brand-500" />
              <div className="text-right">
                <p className="text-gray-500">You get</p>
                <p className="font-semibold">5 hrs legal advice</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm">
              <span className="font-medium text-brand-800">{formatCurrency(750)} ≈ {formatCurrency(750)}</span>
              <span className="badge bg-brand-600 text-white">Balanced trade</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ServiceSwap. Trade value, not cash.</p>
          <div className="flex gap-4">
            <Link href="/services" className="hover:text-gray-900">Browse</Link>
            <Link href="/register" className="hover:text-gray-900">Sign up</Link>
            <Link href="/login" className="hover:text-gray-900">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-3xl font-bold text-brand-700">{value}</dt>
      <dd className="mt-1 text-sm text-gray-500">{label}</dd>
    </div>
  );
}
