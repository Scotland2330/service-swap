"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  tagline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  logoColor: z.string().optional(),
});

export type ProfileFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline") || undefined,
    bio: formData.get("bio") || undefined,
    industry: formData.get("industry") || undefined,
    location: formData.get("location") || undefined,
    website: formData.get("website") || undefined,
    logoColor: formData.get("logoColor") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;
  await prisma.business.update({
    where: { id: session.sub },
    data: {
      name: d.name,
      tagline: d.tagline || null,
      bio: d.bio || null,
      industry: d.industry || null,
      location: d.location || null,
      website: d.website || null,
      logoColor: d.logoColor || "#33806c",
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
