"use server";

import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth-context";
import { dealSchema, DealInput, DealStage } from "@/lib/validations/deals";
import { revalidatePath } from "next/cache";

// 1. Fetch deals with strict organization-level isolation, including linked lead data
export async function getDealsAction(search?: string) {
  try {
    const org = await getActiveOrg();

    // Query builder
    const whereClause: any = {
      organizationId: org.id,
    };

    if (search && search.trim() !== "") {
      const searchVal = search.trim();
      whereClause.OR = [
        { name: { contains: searchVal, mode: "insensitive" } },
        {
          lead: {
            OR: [
              { firstName: { contains: searchVal, mode: "insensitive" } },
              { lastName: { contains: searchVal, mode: "insensitive" } },
              { company: { contains: searchVal, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const deals = await db.deal.findMany({
      where: whereClause,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map decimals and serialize dates for client
    return {
      success: true,
      data: deals.map((deal) => ({
        ...deal,
        value: Number(deal.value),
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.toISOString().split("T")[0] : null,
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[getDealsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch deals." };
  }
}

// 2. Create deal within active org context
export async function createDealAction(input: DealInput) {
  try {
    const org = await getActiveOrg();

    // Validate request data
    const validatedData = dealSchema.parse(input);

    // If a leadId is linked, verify it belongs to the same organization
    if (validatedData.leadId) {
      const linkedLead = await db.lead.findUnique({
        where: { id: validatedData.leadId },
      });
      if (!linkedLead || linkedLead.organizationId !== org.id) {
        throw new Error("Unauthorized: The linked lead does not belong to your organization.");
      }
    }

    const deal = await db.deal.create({
      data: {
        organizationId: org.id,
        name: validatedData.title,
        value: validatedData.value,
        stage: validatedData.stage as any,
        leadId: validatedData.leadId || null,
        expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : null,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath("/dashboard/deals");

    return {
      success: true,
      data: {
        ...deal,
        value: Number(deal.value),
        createdAt: deal.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[createDealAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to create deal." };
  }
}

// 3. Update deal details (with org checks)
export async function updateDealAction(id: string, input: DealInput) {
  try {
    const org = await getActiveOrg();

    // Validate request data
    const validatedData = dealSchema.parse(input);

    // Verify ownership of the deal before mutating
    const existingDeal = await db.deal.findUnique({
      where: { id },
    });

    if (!existingDeal || existingDeal.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    // If a leadId is linked, verify it belongs to the same organization
    if (validatedData.leadId) {
      const linkedLead = await db.lead.findUnique({
        where: { id: validatedData.leadId },
      });
      if (!linkedLead || linkedLead.organizationId !== org.id) {
        throw new Error("Unauthorized: The linked lead does not belong to your organization.");
      }
    }

    const updatedDeal = await db.deal.update({
      where: { id },
      data: {
        name: validatedData.title,
        value: validatedData.value,
        stage: validatedData.stage as any,
        leadId: validatedData.leadId || null,
        expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : null,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath("/dashboard/deals");

    return {
      success: true,
      data: {
        ...updatedDeal,
        value: Number(updatedDeal.value),
        createdAt: updatedDeal.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[updateDealAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to update deal." };
  }
}

// 4. Update stage only (triggered instantly during drop events)
export async function updateDealStageAction(id: string, stage: DealStage) {
  try {
    const org = await getActiveOrg();

    // Verify ownership of the deal
    const existingDeal = await db.deal.findUnique({
      where: { id },
    });

    if (!existingDeal || existingDeal.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    const updatedDeal = await db.deal.update({
      where: { id },
      data: {
        stage: stage as any,
      },
    });

    revalidatePath("/dashboard/deals");

    return {
      success: true,
      data: {
        ...updatedDeal,
        value: Number(updatedDeal.value),
      },
    };
  } catch (error: any) {
    console.error("[updateDealStageAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to update deal stage." };
  }
}

// 5. Delete deal securely
export async function deleteDealAction(id: string) {
  try {
    const org = await getActiveOrg();

    // Verify ownership
    const existingDeal = await db.deal.findUnique({
      where: { id },
    });

    if (!existingDeal || existingDeal.organizationId !== org.id) {
      throw new Error("Unauthorized: Access to this record is denied.");
    }

    await db.deal.delete({
      where: { id },
    });

    revalidatePath("/dashboard/deals");

    return { success: true };
  } catch (error: any) {
    console.error("[deleteDealAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to delete deal." };
  }
}
