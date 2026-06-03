"use server";

import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth-context";
import { revalidatePath } from "next/cache";

export async function getContactsAction(search?: string) {
  try {
    const org = await getActiveOrg();
    
    const whereClause: any = {
      organizationId: org.id,
    };

    if (search && search.trim() !== "") {
      const searchVal = search.trim();
      whereClause.OR = [
        { firstName: { contains: searchVal, mode: "insensitive" } },
        { lastName: { contains: searchVal, mode: "insensitive" } },
        { phone: { contains: searchVal, mode: "insensitive" } },
        { email: { contains: searchVal, mode: "insensitive" } },
        { companyName: { contains: searchVal, mode: "insensitive" } },
      ];
    }

    const contacts = await db.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: contacts.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[getContactsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch contacts." };
  }
}

export async function createContactAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  companyName?: string;
  jobTitle?: string;
}) {
  try {
    const org = await getActiveOrg();

    const contact = await db.contact.create({
      data: {
        organizationId: org.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email || null,
        companyName: input.companyName || null,
        jobTitle: input.jobTitle || null,
      },
    });

    revalidatePath("/dashboard/contacts");

    return {
      success: true,
      data: {
        ...contact,
        createdAt: contact.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[createContactAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to create contact." };
  }
}
