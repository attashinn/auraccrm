"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  type OnboardingData,
} from "@/lib/validations/onboarding";
import { revalidatePath } from "next/cache";

const TOTAL_STEPS = 5;

function toOnboardingJson(data: OnboardingData): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

function formatActionError(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    const issue = error.issues?.[0];
    if (issue) return issue.message;
    const errors = (error as unknown as Record<string, Record<string, string>[]>).errors;
    if (Array.isArray(errors) && errors[0]) {
      return errors[0].message ?? fallback;
    }
  }
  if (error instanceof Error) {
    if (error.message.includes("Unknown argument") || error.message.includes("onboardingData")) {
      return "Workspace setup failed. Restart the dev server, then try again.";
    }
    return error.message.length <= 280 ? error.message : fallback;
  }
  return fallback;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `org-${Date.now()}`;
}

async function ensureDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({ where: { clerkId: userId } });
  if (user) return { user, clerkUserId: userId };

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("User email not found");

  user = await db.user.create({
    data: {
      clerkId: userId,
      email,
      firstName: clerkUser?.firstName ?? "",
      lastName: clerkUser?.lastName ?? "",
    },
  });

  return { user, clerkUserId: userId };
}

export async function getOnboardingStatusAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return { success: true as const, needsOnboarding: false, step: 1, totalSteps: TOTAL_STEPS };
    }

    if (!orgId) {
      const user = await db.user.findUnique({ where: { clerkId: userId } });
      const data: OnboardingData = {};
      if (user?.firstName) data.firstName = user.firstName;
      if (user?.lastName) data.lastName = user.lastName;
      return { success: true as const, needsOnboarding: true, step: 1, totalSteps: TOTAL_STEPS, data };
    }

    const org = await db.organization.findUnique({ where: { clerkId: orgId } });
    if (!org || !org.onboardingCompleted) {
      const data = (org?.onboardingData as OnboardingData | null) ?? {};
      let step = 1;
      if (data.companyName) step = 2;
      if (data.address) step = 3;
      if (data.teamSize) step = 4;
      if (data.primaryGoal) step = 5;
      return { success: true as const, needsOnboarding: true, step, totalSteps: TOTAL_STEPS, data };
    }

    return { success: true as const, needsOnboarding: false, step: TOTAL_STEPS, totalSteps: TOTAL_STEPS };
  } catch (error: unknown) {
    const message = formatActionError(error, "Failed to load onboarding status");
    return { success: false as const, error: message };
  }
}

export async function saveOnboardingStep1Action(input: unknown) {
  try {
    const parsed = onboardingStep1Schema.parse(input);
    const { user, clerkUserId } = await ensureDbUser();

    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkUserId, {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
    });

    await db.user.update({
      where: { id: user.id },
      data: { firstName: parsed.firstName, lastName: parsed.lastName },
    });

    return { success: true as const, data: parsed };
  } catch (error: unknown) {
    const message = formatActionError(error, "Failed to save step 1");
    return { success: false as const, error: message };
  }
}

export async function saveOnboardingStep2Action(input: unknown, draft: OnboardingData) {
  try {
    const parsed = onboardingStep2Schema.parse(input);
    const merged = { ...draft, ...parsed };
    return { success: true as const, data: merged };
  } catch (error: unknown) {
    const message = formatActionError(error, "Failed to save step 2");
    return { success: false as const, error: message };
  }
}

export async function saveOnboardingStep3Action(input: unknown, draft: OnboardingData) {
  try {
    const parsed = onboardingStep3Schema.parse(input);
    const merged: OnboardingData = { ...draft, ...parsed };

    const { user, clerkUserId } = await ensureDbUser();
    const { orgId } = await auth();

    const companyName = merged.companyName;
    if (!companyName) {
      throw new Error("Company name is required. Go back to step 1.");
    }

    let clerkOrgId = orgId;

    if (!clerkOrgId) {
      const clerk = await clerkClient();
      const slug = `${slugify(companyName)}-${Date.now().toString(36).slice(-6)}`;
      const created = await clerk.organizations.createOrganization({
        name: companyName,
        slug,
        createdBy: clerkUserId,
      });
      clerkOrgId = created.id;

      const org = await db.organization.create({
        data: {
          clerkId: clerkOrgId,
          name: companyName,
          slug,
          onboardingData: toOnboardingJson(merged),
          onboardingCompleted: false,
        },
      });

      await db.membership.upsert({
        where: {
          unique_user_org: { userId: user.id, organizationId: org.id },
        },
        create: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
        },
        update: { role: "OWNER" },
      });
    } else {
      const org = await db.organization.findUnique({ where: { clerkId: clerkOrgId } });
      if (org) {
        await db.organization.update({
          where: { id: org.id },
          data: { onboardingData: toOnboardingJson(merged), name: companyName },
        });
      }
    }

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");

    return { success: true as const, data: merged, organizationId: clerkOrgId };
  } catch (error: unknown) {
    const message = formatActionError(error, "Failed to save step 3");
    return { success: false as const, error: message };
  }
}

export async function saveOnboardingStep4Action(input: unknown, draft: OnboardingData) {
  try {
    const parsed = onboardingStep4Schema.parse(input);
    const merged = { ...draft, ...parsed };

    const { orgId } = await auth();
    if (orgId) {
      const org = await db.organization.findUnique({ where: { clerkId: orgId } });
      if (org) {
        await db.organization.update({
          where: { id: org.id },
          data: { onboardingData: toOnboardingJson(merged) },
        });
      }
    }

    return { success: true as const, data: merged };
  } catch (error: unknown) {
    const message = formatActionError(error, "Failed to save step 4");
    return { success: false as const, error: message };
  }
}

export async function completeOnboardingAction(draft: OnboardingData) {
  try {
    const { orgId } = await auth();
    if (!orgId) throw new Error("No active organization. Complete step 3 first.");

    const org = await db.organization.findUnique({ where: { clerkId: orgId } });
    if (!org) throw new Error("Organization not found");

    await db.organization.update({
      where: { id: org.id },
      data: {
        onboardingCompleted: true,
        onboardingData: toOnboardingJson(draft),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");

    return { success: true as const };
  } catch (error: unknown) {
    const message = formatActionError(error, "Failed to complete onboarding");
    return { success: false as const, error: message };
  }
}
