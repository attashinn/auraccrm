"use server";

import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth-context";
import { taskSchema, TaskInput, TaskStatus } from "@/lib/validations/tasks";
import { revalidatePath } from "next/cache";

// ── Fetch org members for assignment dropdown ──────────────────────────────
export async function getOrgMembersAction() {
  try {
    const org = await getActiveOrg();

    const members = await db.membership.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      data: members.map((m) => ({
        membershipId: m.id,
        role: m.role,
        userId: m.userId,
        firstName: m.user.firstName || "",
        lastName: m.user.lastName || "",
        email: m.user.email,
      })),
    };
  } catch (error: any) {
    console.error("[getOrgMembersAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch members." };
  }
}

// 1. Fetch tasks with strict organization-level isolation
export async function getTasksAction(filters?: { search?: string; status?: string }) {
  try {
    const org = await getActiveOrg();

    const whereClause: any = {
      organizationId: org.id,
    };

    if (filters?.search && filters.search.trim() !== "") {
      const searchVal = filters.search.trim();
      whereClause.OR = [
        { title: { contains: searchVal, mode: "insensitive" } },
        { description: { contains: searchVal, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "ALL") {
      whereClause.status = filters.status as any;
    }

    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        lead: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        deal: {
          select: { id: true, name: true },
        },
        assignedTo: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return {
      success: true,
      data: tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[getTasksAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch tasks." };
  }
}

// 2. Create task within active org context
export async function createTaskAction(input: TaskInput) {
  try {
    const org = await getActiveOrg();
    const validatedData = taskSchema.parse(input);

    // Verify linked lead belongs to this org
    if (validatedData.leadId) {
      const linkedLead = await db.lead.findUnique({ where: { id: validatedData.leadId } });
      if (!linkedLead || linkedLead.organizationId !== org.id) {
        throw new Error("Unauthorized: The linked lead does not belong to your organization.");
      }
    }

    // Verify linked deal belongs to this org
    if (validatedData.dealId) {
      const linkedDeal = await db.deal.findUnique({ where: { id: validatedData.dealId } });
      if (!linkedDeal || linkedDeal.organizationId !== org.id) {
        throw new Error("Unauthorized: The linked deal does not belong to your organization.");
      }
    }

    // Verify assignee membership belongs to this org
    if (validatedData.assignedToMembershipId) {
      const membership = await db.membership.findUnique({
        where: { id: validatedData.assignedToMembershipId },
      });
      if (!membership || membership.organizationId !== org.id) {
        throw new Error("Unauthorized: The assigned user is not a member of your organization.");
      }
    }

    const task = await db.task.create({
      data: {
        organizationId: org.id,
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status as any,
        priority: validatedData.priority as any,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assignedToMembershipId: validatedData.assignedToMembershipId || null,
        leadId: validatedData.leadId || null,
        dealId: validatedData.dealId || null,
      },
    });

    revalidatePath("/dashboard/tasks");

    return {
      success: true,
      data: {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[createTaskAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to create task." };
  }
}

// 3. Update task
export async function updateTaskAction(id: string, input: TaskInput) {
  try {
    const org = await getActiveOrg();
    const validatedData = taskSchema.parse(input);

    const existingTask = await db.task.findUnique({ where: { id } });
    if (!existingTask || existingTask.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    if (validatedData.leadId) {
      const linkedLead = await db.lead.findUnique({ where: { id: validatedData.leadId } });
      if (!linkedLead || linkedLead.organizationId !== org.id) {
        throw new Error("Unauthorized: The linked lead does not belong to your organization.");
      }
    }

    if (validatedData.dealId) {
      const linkedDeal = await db.deal.findUnique({ where: { id: validatedData.dealId } });
      if (!linkedDeal || linkedDeal.organizationId !== org.id) {
        throw new Error("Unauthorized: The linked deal does not belong to your organization.");
      }
    }

    if (validatedData.assignedToMembershipId) {
      const membership = await db.membership.findUnique({
        where: { id: validatedData.assignedToMembershipId },
      });
      if (!membership || membership.organizationId !== org.id) {
        throw new Error("Unauthorized: The assigned user is not a member of your organization.");
      }
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status as any,
        priority: validatedData.priority as any,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assignedToMembershipId: validatedData.assignedToMembershipId || null,
        leadId: validatedData.leadId || null,
        dealId: validatedData.dealId || null,
      },
    });

    revalidatePath("/dashboard/tasks");

    return {
      success: true,
      data: {
        ...updatedTask,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
        createdAt: updatedTask.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[updateTaskAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to update task." };
  }
}

// 4. Toggle task status (TODO → IN_PROGRESS → COMPLETED → TODO cycle)
export async function toggleTaskStatusAction(id: string) {
  try {
    const org = await getActiveOrg();

    const existingTask = await db.task.findUnique({ where: { id } });
    if (!existingTask || existingTask.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    const statusCycle: Record<string, string> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "COMPLETED",
      COMPLETED: "TODO",
    };
    const newStatus = statusCycle[existingTask.status] ?? "TODO";

    const updatedTask = await db.task.update({
      where: { id },
      data: { status: newStatus as any },
    });

    revalidatePath("/dashboard/tasks");

    return {
      success: true,
      data: {
        ...updatedTask,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
      },
    };
  } catch (error: any) {
    console.error("[toggleTaskStatusAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to toggle task status." };
  }
}

// 5. Delete task securely
export async function deleteTaskAction(id: string) {
  try {
    const org = await getActiveOrg();

    const existingTask = await db.task.findUnique({ where: { id } });
    if (!existingTask || existingTask.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    await db.task.delete({ where: { id } });

    revalidatePath("/dashboard/tasks");

    return { success: true };
  } catch (error: any) {
    console.error("[deleteTaskAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to delete task." };
  }
}
