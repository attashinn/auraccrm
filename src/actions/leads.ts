"use server";

import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth-context";
import { leadSchema, LeadInput, LeadStatus } from "@/lib/validations/leads";
import { revalidatePath } from "next/cache";

// 1. Fetch leads with strict organization-level isolation
export async function getLeadsAction(filters?: { search?: string; status?: string }) {
  try {
    const org = await getActiveOrg();

    // Query builder
    const whereClause: any = {
      organizationId: org.id,
    };

    // Apply search filter if provided
    if (filters?.search && filters.search.trim() !== "") {
      const searchVal = filters.search.trim();
      whereClause.OR = [
        { firstName: { contains: searchVal, mode: "insensitive" } },
        { lastName: { contains: searchVal, mode: "insensitive" } },
        { email: { contains: searchVal, mode: "insensitive" } },
        { company: { contains: searchVal, mode: "insensitive" } },
        { source: { contains: searchVal, mode: "insensitive" } },
      ];
    }

    // Apply status filter if provided
    if (filters?.status && filters.status !== "ALL") {
      whereClause.status = filters.status as any;
    }

    const leads = await db.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Map decimal to standard JS number for clean JSON serialization
    return {
      success: true,
      data: leads.map((lead) => ({
        ...lead,
        value: Number(lead.value),
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[getLeadsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch leads." };
  }
}

// 2. Create lead inside active org context
export async function createLeadAction(input: LeadInput) {
  try {
    const org = await getActiveOrg();

    // Validate request data
    const validatedData = leadSchema.parse(input);

    const lead = await db.lead.create({
      data: {
        organizationId: org.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        source: validatedData.source || null,
        status: validatedData.status as any,
        notes: validatedData.notes || null,
        value: validatedData.value,
      },
    });

    revalidatePath("/dashboard/leads");

    return {
      success: true,
      data: {
        ...lead,
        value: Number(lead.value),
        createdAt: lead.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[createLeadAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to create lead." };
  }
}

// 3. Update lead details (with org checks)
export async function updateLeadAction(id: string, input: LeadInput) {
  try {
    const org = await getActiveOrg();

    // Validate request data
    const validatedData = leadSchema.parse(input);

    // Verify ownership of the lead before mutating
    const existingLead = await db.lead.findUnique({
      where: { id },
    });

    if (!existingLead || existingLead.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        source: validatedData.source || null,
        status: validatedData.status as any,
        notes: validatedData.notes || null,
        value: validatedData.value,
      },
    });

    revalidatePath("/dashboard/leads");

    return {
      success: true,
      data: {
        ...updatedLead,
        value: Number(updatedLead.value),
        createdAt: updatedLead.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[updateLeadAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to update lead." };
  }
}

// 4. Update status alone (useful for inline updates or boards)
export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  try {
    const org = await getActiveOrg();

    // Verify ownership of the lead
    const existingLead = await db.lead.findUnique({
      where: { id },
    });

    if (!existingLead || existingLead.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        status: status as any,
      },
    });

    revalidatePath("/dashboard/leads");

    return {
      success: true,
      data: {
        ...updatedLead,
        value: Number(updatedLead.value),
      },
    };
  } catch (error: any) {
    console.error("[updateLeadStatusAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to update lead status." };
  }
}

// 5. Delete lead securely
export async function deleteLeadAction(id: string) {
  try {
    const org = await getActiveOrg();

    // Verify ownership
    const existingLead = await db.lead.findUnique({
      where: { id },
    });

    if (!existingLead || existingLead.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    await db.lead.delete({
      where: { id },
    });

    revalidatePath("/dashboard/leads");

    return { success: true };
  } catch (error: any) {
    console.error("[deleteLeadAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to delete lead." };
  }
}
