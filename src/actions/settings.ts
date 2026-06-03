"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveContext } from "@/lib/auth-context";
import { encryptToken } from "@/lib/whatsapp/encryption";
import { registerMetaPhoneNumber } from "@/lib/whatsapp/meta-api";

// ==========================================
// 1. User Profile Actions
// ==========================================

export async function getUserProfileAction() {
  try {
    const { user, membership } = await getActiveContext();
    return {
      success: true as const,
      data: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: membership.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to load profile." };
  }
}

export async function updateUserProfileAction(input: { firstName: string; lastName: string }) {
  try {
    const { user, clerkUserId } = await getActiveContext();
    const clerk = await clerkClient();
    
    await clerk.users.updateUser(clerkUserId, {
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const, data: updatedUser };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update profile." };
  }
}

export async function updateUserPasswordAction(input: { password: string }) {
  try {
    const { clerkUserId } = await getActiveContext();
    const clerk = await clerkClient();
    
    await clerk.users.updateUser(clerkUserId, {
      password: input.password,
    });
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update password." };
  }
}

export async function revokeAllSessionsAction() {
  try {
    const { clerkUserId } = await getActiveContext();
    const clerk = await clerkClient();
    
    // Revoke all active sessions (logs out user of all devices)
    const sessionsResponse = await clerk.sessions.getSessionList({
      userId: clerkUserId,
      status: "active",
    });

    for (const session of sessionsResponse.data) {
      await clerk.sessions.revokeSession(session.id);
    }
    
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to revoke sessions." };
  }
}

// ==========================================
// 2. WhatsApp Config Actions
// ==========================================

export async function getWhatsAppConfigAction() {
  try {
    const { org } = await getActiveContext();
    const config = await db.whatsappConfig.findUnique({
      where: { organizationId: org.id },
    });
    
    if (!config) return { success: true as const, data: null };

    return {
      success: true as const,
      data: {
        phoneNumberId: config.phoneNumberId,
        wabaId: config.wabaId,
        accessToken: config.accessToken ? "••••••••••••" : "",
        verifyToken: config.verifyToken,
        status: config.status,
        connectedAt: config.connectedAt ? config.connectedAt.toISOString() : null,
      },
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to load WhatsApp configuration." };
  }
}

export async function saveWhatsAppConfigAction(input: {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  pin?: string;
}) {
  try {
    const { org } = await getActiveContext();
    let finalAccessToken = input.accessToken;

    if (finalAccessToken === "••••••••••••") {
      const existing = await db.whatsappConfig.findUnique({
        where: { organizationId: org.id },
      });
      if (!existing) {
        throw new Error("Invalid access token configuration.");
      }
      finalAccessToken = existing.accessToken;
    } else {
      finalAccessToken = encryptToken(finalAccessToken);
    }

    // Call Meta register API if 6-digit PIN is provided
    if (input.pin && input.pin.trim()) {
      await registerMetaPhoneNumber(input.phoneNumberId, finalAccessToken, input.pin.trim());
    }

    const config = await db.whatsappConfig.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        accessToken: finalAccessToken,
        verifyToken: input.verifyToken,
        status: "connected",
        connectedAt: new Date(),
      },
      update: {
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        accessToken: finalAccessToken,
        verifyToken: input.verifyToken,
        status: "connected",
        connectedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const, data: { status: config.status } };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to save WhatsApp configuration." };
  }
}

// ==========================================
// 3. Message Templates Actions
// ==========================================

export async function getTemplatesAction() {
  try {
    const { org } = await getActiveContext();
    const templates = await db.messageTemplate.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    });
    
    return {
      success: true as const,
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        language: t.language,
        headerType: t.headerType,
        headerContent: t.headerContent,
        bodyText: t.bodyText,
        footerText: t.footerText,
        buttons: t.buttons,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to load templates." };
  }
}

export async function createTemplateAction(input: {
  name: string;
  category: string;
  language: string;
  headerType?: string;
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  buttons?: any;
  status?: string;
}) {
  try {
    const { org } = await getActiveContext();
    
    // Check duplication
    const duplicate = await db.messageTemplate.findUnique({
      where: {
        organizationId_name_language: {
          organizationId: org.id,
          name: input.name,
          language: input.language || "en_US",
        },
      },
    });
    if (duplicate) {
      throw new Error(`A template with the name "${input.name}" and language "${input.language || "en_US"}" already exists.`);
    }

    const template = await db.messageTemplate.create({
      data: {
        organizationId: org.id,
        name: input.name,
        category: input.category,
        language: input.language || "en_US",
        headerType: input.headerType || null,
        headerContent: input.headerContent || null,
        bodyText: input.bodyText,
        footerText: input.footerText || null,
        buttons: input.buttons || null,
        status: input.status || "Approved",
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const, data: template };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create template." };
  }
}

export async function updateTemplateAction(
  id: string,
  input: {
    category?: string;
    language?: string;
    headerType?: string;
    headerContent?: string;
    bodyText?: string;
    footerText?: string;
    buttons?: any;
    status?: string;
  }
) {
  try {
    const { org } = await getActiveContext();
    
    await db.messageTemplate.update({
      where: { id, organizationId: org.id },
      data: {
        category: input.category,
        language: input.language,
        headerType: input.headerType,
        headerContent: input.headerContent,
        bodyText: input.bodyText,
        footerText: input.footerText,
        buttons: input.buttons,
        status: input.status,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update template." };
  }
}

export async function deleteTemplateAction(id: string) {
  try {
    const { org } = await getActiveContext();
    
    await db.messageTemplate.delete({
      where: { id, organizationId: org.id },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete template." };
  }
}

// ==========================================
// 4. Contact Tags Actions
// ==========================================

export async function getTagsAction() {
  try {
    const { org } = await getActiveContext();
    const tags = await db.tag.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    });
    
    return {
      success: true as const,
      data: tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to load tags." };
  }
}

export async function createTagAction(input: { name: string; color: string }) {
  try {
    const { org } = await getActiveContext();
    
    // Check duplication
    const duplicate = await db.tag.findUnique({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: input.name,
        },
      },
    });
    if (duplicate) {
      throw new Error(`A tag with the name "${input.name}" already exists.`);
    }

    const tag = await db.tag.create({
      data: {
        organizationId: org.id,
        name: input.name,
        color: input.color,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const, data: tag };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create tag." };
  }
}

export async function updateTagAction(id: string, input: { name?: string; color?: string }) {
  try {
    const { org } = await getActiveContext();
    
    if (input.name) {
      const duplicate = await db.tag.findFirst({
        where: {
          organizationId: org.id,
          name: input.name,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error(`A tag with the name "${input.name}" already exists.`);
      }
    }

    const tag = await db.tag.update({
      where: { id, organizationId: org.id },
      data: {
        name: input.name,
        color: input.color,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const, data: tag };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update tag." };
  }
}

export async function deleteTagAction(id: string) {
  try {
    const { org } = await getActiveContext();
    
    await db.tag.delete({
      where: { id, organizationId: org.id },
    });

    revalidatePath("/dashboard/settings");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete tag." };
  }
}
