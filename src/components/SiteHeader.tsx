import Link from "next/link";
import { getCurrentBusiness } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/authActions";
import { prisma } from "@/lib/db";
import { Logo, Avatar } from "./ui";

export default async function SiteHeader() {
  const business = await getCurrentBusiness();

  let pendingCount = 0;
  if (business) {
    pendingCount = await prisma.swapProposal.count({
      where: { recipientId: business.id, status: "PENDING" },
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/services">Browse services</NavLink>
            {business && <NavLink href="/dashboard">Dashboard</NavLink>}
            {business && (
              <NavLink href="/swaps">
                Swaps
                {pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {business ? (
            <>
              <Link href="/services/new" className="btn-primary hidden sm:inline-flex">
                + List a service
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-100"
              >
                <Avatar name={business.name} color={business.logoColor} size={32} />
                <span className="hidden text-sm font-medium text-gray-700 lg:inline">
                  {business.name}
                </span>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn-ghost">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </Link>
  );
}
