"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const serviceSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Add a short description (10+ characters)"),
  category: z.string().min(1, "Pick a category"),
  pricingModel: z.enum(["HOURLY", "FIXED"]),
  hourlyRate: z.coerce.number().min(0),
  fixedValue: z.coerce.number().min(0),
});

export type ServiceFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    pricingModel: formData.get("pricingModel"),
    hourlyRate: formData.get("hourlyRate") || 0,
    fixedValue: formData.get("fixedValue") || 0,
  });
}

export async function createServiceAction(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;
  if (d.pricingModel === "HOURLY" && d.hourlyRate <= 0) {
    return { fieldErrors: { hourlyRate: "Enter an hourly rate greater than 0" } };
  }
  if (d.pricingModel === "FIXED" && d.fixedValue <= 0) {
    return { fieldErrors: { fixedValue: "Enter a project value greater than 0" } };
  }

  await prisma.service.create({
    data: {
      businessId: session.sub,
      title: d.title,
      description: d.description,
      category: d.category,
      pricingModel: d.pricingModel,
      hourlyRate: d.pricingModel === "HOURLY" ? d.hourlyRate : 0,
      fixedValue: d.pricingModel === "FIXED" ? d.fixedValue : 0,
    },
  });

  revalidatePath("/services");
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=services");
}

export async function updateServiceAction(
  serviceId: string,
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.businessId !== session.sub) {
    return { error: "Service not found." };
  }

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      title: d.title,
      description: d.description,
      category: d.category,
      pricingModel: d.pricingModel,
      hourlyRate: d.pricingModel === "HOURLY" ? d.hourlyRate : 0,
      fixedValue: d.pricingModel === "FIXED" ? d.fixedValue : 0,
    },
  });

  revalidatePath("/services");
  revalidatePath("/dashboard");
  redirect("/dashboard?tab=services");
}

export async function toggleServiceActiveAction(serviceId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.businessId !== session.sub) return;
  await prisma.service.update({
    where: { id: serviceId },
    data: { active: !service.active },
  });
  revalidatePath("/dashboard");
  revalidatePath("/services");
}

export async function deleteServiceAction(serviceId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.businessId !== session.sub) return;

  // Guard: don't delete a service tied to a live proposal — deactivate instead.
  const inUse = await prisma.swapProposal.count({
    where: {
      status: { in: ["PENDING", "ACCEPTED"] },
      OR: [{ offeredServiceId: serviceId }, { requestedServiceId: serviceId }],
    },
  });
  if (inUse > 0) {
    await prisma.service.update({ where: { id: serviceId }, data: { active: false } });
  } else {
    await prisma.service.delete({ where: { id: serviceId } });
  }
  revalidatePath("/dashboard");
  revalidatePath("/services");
}
