"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type RequestFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const requestSchema = z.object({
  title: z.string().min(3, "Give your request a title"),
  description: z.string().min(10, "Describe what you need (10+ characters)"),
  category: z.string().min(1, "Pick a category"),
  estimatedValue: z.coerce.number().min(0),
  offering: z.string().optional(),
});

export async function createRequestAction(
  _prev: RequestFormState,
  formData: FormData
): Promise<RequestFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = requestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    estimatedValue: formData.get("estimatedValue") || 0,
    offering: formData.get("offering") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;
  const request = await prisma.serviceRequest.create({
    data: {
      requesterId: session.sub,
      title: d.title,
      description: d.description,
      category: d.category,
      estimatedValue: d.estimatedValue,
      offering: d.offering || null,
    },
  });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  redirect(`/requests/${request.id}`);
}

export async function closeRequestAction(requestId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request || request.requesterId !== session.sub) return;
  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status: request.status === "CLOSED" ? "OPEN" : "CLOSED" },
  });
  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
}
