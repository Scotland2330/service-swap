import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Business profile</h1>
        <Link href={`/businesses/${business.id}`} className="text-sm text-brand-700 hover:underline">
          View public page →
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        This is how other businesses see you across ServiceSwap.
      </p>

      <div className="card mt-6 p-6">
        <ProfileForm
          defaults={{
            name: business.name,
            tagline: business.tagline,
            bio: business.bio,
            industry: business.industry,
            location: business.location,
            website: business.website,
            logoColor: business.logoColor,
          }}
        />
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Signed in as {business.email}
      </p>
    </div>
  );
}
