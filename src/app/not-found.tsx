import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="scale-110" />
      <div>
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-1 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/" className="btn-secondary">Go home</Link>
        <Link href="/services" className="btn-primary">Browse services</Link>
      </div>
    </div>
  );
}
