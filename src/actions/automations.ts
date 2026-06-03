"use server";

import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth-context";
import { revalidatePath } from "next/cache";

export async function getAutomationsAction() {
  try {
    const org = await getActiveOrg();
    const automations = await db.automation.findMany({
      where: { organizationId: org.id },
      include: {
        steps: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: automations.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        lastExecutedAt: a.lastExecutedAt ? a.lastExecutedAt.toISOString() : null,
        steps: a.steps.map((s) => ({
          ...s,
        })),
      })),
    };
  } catch (error: any) {
    console.error("[getAutomationsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch automations." };
  }
}

export async function getAutomationByIdAction(id: string) {
  try {
    const org = await getActiveOrg();
    const automation = await db.automation.findFirst({
      where: { id, organizationId: org.id },
      include: {
        steps: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!automation) {
      return { success: false, error: "Automation workflow not found." };
    }

    return {
      success: true,
      data: {
        ...automation,
        createdAt: automation.createdAt.toISOString(),
        updatedAt: automation.updatedAt.toISOString(),
        lastExecutedAt: automation.lastExecutedAt ? automation.lastExecutedAt.toISOString() : null,
        steps: automation.steps.map((s) => ({
          ...s,
        })),
      },
    };
  } catch (error: any) {
    console.error("[getAutomationByIdAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch automation." };
  }
}

export async function saveAutomationAction(data: {
  id?: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: any;
  isActive: boolean;
  steps: {
    stepType: string;
    stepConfig: any;
  }[];
}) {
  try {
    const org = await getActiveOrg();

    const result = await db.$transaction(async (tx) => {
      let automation;

      if (data.id) {
        // Update existing automation
        automation = await tx.automation.update({
          where: { id: data.id, organizationId: org.id },
          data: {
            name: data.name,
            description: data.description || null,
            triggerType: data.triggerType,
            triggerConfig: data.triggerConfig || {},
            isActive: data.isActive,
          },
        });

        // Delete existing steps
        await tx.automationStep.deleteMany({
          where: { automationId: data.id },
        });
      } else {
        // Create new automation
        automation = await tx.automation.create({
          data: {
            organizationId: org.id,
            name: data.name,
            description: data.description || null,
            triggerType: data.triggerType,
            triggerConfig: data.triggerConfig || {},
            isActive: data.isActive,
          },
        });
      }

      // Add new steps
      if (data.steps && data.steps.length > 0) {
        await tx.automationStep.createMany({
          data: data.steps.map((step, index) => ({
            automationId: automation.id,
            stepType: step.stepType,
            stepConfig: step.stepConfig || {},
            position: index,
          })),
        });
      }

      return automation;
    });

    revalidatePath("/dashboard/automations");

    return {
      success: true,
      data: {
        id: result.id,
        name: result.name,
      },
    };
  } catch (error: any) {
    console.error("[saveAutomationAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to save automation." };
  }
}

export async function deleteAutomationAction(id: string) {
  try {
    const org = await getActiveOrg();

    await db.automation.delete({
      where: { id, organizationId: org.id },
    });

    revalidatePath("/dashboard/automations");

    return { success: true };
  } catch (error: any) {
    console.error("[deleteAutomationAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to delete automation." };
  }
}

export async function toggleAutomationStatusAction(id: string, isActive: boolean) {
  try {
    const org = await getActiveOrg();

    await db.automation.update({
      where: { id, organizationId: org.id },
      data: { isActive },
    });

    revalidatePath("/dashboard/automations");

    return { success: true };
  } catch (error: any) {
    console.error("[toggleAutomationStatusAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to toggle status." };
  }
}
