"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  industry: z.string().optional(),
  location: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    industry: formData.get("industry") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password, industry, location } = parsed.data;
  const existing = await prisma.business.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const business = await prisma.business.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      industry: industry || null,
      location: location || null,
    },
  });

  await createSession({ sub: business.id, email: business.email, name: business.name });
  redirect("/dashboard");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { email, password } = parsed.data;
  const business = await prisma.business.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!business || !(await verifyPassword(password, business.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession({ sub: business.id, email: business.email, name: business.name });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
