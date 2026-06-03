"use server";

import { db } from "@/lib/db";
import { getActiveContext } from "@/lib/auth-context";
import { sendMetaTextMessage } from "@/lib/whatsapp/meta-api";
import { revalidatePath } from "next/cache";

/**
 * 1. Fetch conversations for the active organization, with contact details and last message
 */
export async function getConversationsAction(search?: string, status: string = "open") {
  try {
    const { org } = await getActiveContext();

    const whereClause: any = {
      organizationId: org.id,
      status: status,
    };

    if (search && search.trim() !== "") {
      const searchVal = search.trim();
      whereClause.contact = {
        OR: [
          { firstName: { contains: searchVal, mode: "insensitive" } },
          { lastName: { contains: searchVal, mode: "insensitive" } },
          { phone: { contains: searchVal, mode: "insensitive" } },
        ],
      };
    }

    const conversations = await db.conversation.findMany({
      where: whereClause,
      include: {
        contact: true,
        assignedAgent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      data: conversations.map((c) => ({
        id: c.id,
        status: c.status,
        unreadCount: c.unreadCount,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        contact: c.contact,
        assignedAgent: c.assignedAgent
          ? {
              id: c.assignedAgent.id,
              name: `${c.assignedAgent.user.firstName || ""} ${c.assignedAgent.user.lastName || ""}`.trim() || "Agent",
            }
          : null,
        lastMessage: c.messages[0]
          ? {
              id: c.messages[0].id,
              content: c.messages[0].content,
              createdAt: c.messages[0].createdAt.toISOString(),
              senderType: c.messages[0].senderType,
            }
          : null,
      })),
    };
  } catch (error: any) {
    console.error("[getConversationsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch conversations." };
  }
}

/**
 * 2. Fetch message history for a conversation
 */
export async function getMessagesAction(conversationId: string) {
  try {
    const { org } = await getActiveContext();

    // Verify conversation belongs to active org
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, organizationId: org.id },
    });

    if (!conversation) {
      throw new Error("Unauthorized: Conversation not found.");
    }

    // Mark conversation as read
    await db.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      data: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[getMessagesAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch message history." };
  }
}

/**
 * 3. Send outgoing text message via WhatsApp Business API
 */
export async function sendMessageAction(conversationId: string, text: string) {
  try {
    const { org, user, membership } = await getActiveContext();

    // Verify conversation
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, organizationId: org.id },
      include: { contact: true },
    });

    if (!conversation || !conversation.contact) {
      throw new Error("Conversation or Contact not found.");
    }

    // Get WhatsApp API credentials
    const config = await db.whatsappConfig.findFirst({
      where: { organizationId: org.id, status: "connected" },
    });

    if (!config) {
      throw new Error("WhatsApp connection is not set up or disconnected. Please configure in Settings.");
    }

    const contactPhone = conversation.contact.phone;
    if (!contactPhone) {
      throw new Error("Cannot send message: Contact does not have a phone number.");
    }

    // Call Meta Graph API
    let metaResult;
    try {
      metaResult = await sendMetaTextMessage(
        config.phoneNumberId,
        config.accessToken,
        contactPhone,
        text
      );
    } catch (e: any) {
      throw new Error(`WhatsApp API delivery failed: ${e.message}`);
    }

    const wamid = metaResult.messages?.[0]?.id;

    // Save message locally
    const createdMsg = await db.message.create({
      data: {
        organizationId: org.id,
        conversationId,
        senderType: "agent",
        contentType: "text",
        content: text,
        status: "sent",
        messageId: wamid,
        metadata: {
          agentId: membership.id,
          agentName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        },
      },
    });

    // Touch conversation update time and reset unread count
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount: 0,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/inbox");

    return {
      success: true,
      data: {
        ...createdMsg,
        createdAt: createdMsg.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[sendMessageAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to send message." };
  }
}

/**
 * 4. Assign conversation to an agent
 */
export async function assignConversationAction(conversationId: string, agentMembershipId: string | null) {
  try {
    const { org } = await getActiveContext();

    // Verify conversation
    const existing = await db.conversation.findFirst({
      where: { id: conversationId, organizationId: org.id },
    });

    if (!existing) {
      throw new Error("Unauthorized: Access denied.");
    }

    // If an agent is specified, verify membership matches active organization
    if (agentMembershipId) {
      const membership = await db.membership.findFirst({
        where: { id: agentMembershipId, organizationId: org.id },
      });
      if (!membership) {
        throw new Error("Invalid agent selection.");
      }
    }

    const updated = await db.conversation.update({
      where: { id: conversationId },
      data: {
        assignedAgentId: agentMembershipId || null,
      },
      include: {
        assignedAgent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dashboard/inbox");

    return {
      success: true,
      data: updated.assignedAgent
        ? `${updated.assignedAgent.user.firstName || ""} ${updated.assignedAgent.user.lastName || ""}`.trim()
        : null,
    };
  } catch (error: any) {
    console.error("[assignConversationAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to assign conversation." };
  }
}

/**
 * 5. Update conversation status (open, pending, closed)
 */
export async function updateConversationStatusAction(conversationId: string, status: string) {
  try {
    const { org } = await getActiveContext();

    // Verify conversation
    const existing = await db.conversation.findFirst({
      where: { id: conversationId, organizationId: org.id },
    });

    if (!existing) {
      throw new Error("Unauthorized: Access denied.");
    }

    if (!["open", "pending", "closed"].includes(status)) {
      throw new Error("Invalid status type.");
    }

    await db.conversation.update({
      where: { id: conversationId },
      data: { status },
    });

    revalidatePath("/dashboard/inbox");

    return { success: true };
  } catch (error: any) {
    console.error("[updateConversationStatusAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to update conversation status." };
  }
}

/**
 * 6. Get list of active agents (members) for the assignment dropdown
 */
export async function getAgentsAction() {
  try {
    const { org } = await getActiveContext();

    const agents = await db.membership.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: agents.map((a) => ({
        id: a.id,
        name: `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() || a.user.email,
        role: a.role,
      })),
    };
  } catch (error: any) {
    console.error("[getAgentsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch agents list." };
  }
}

/**
 * 7. Fetch notes for a contact
 */
export async function getContactNotesAction(contactId: string) {
  try {
    const { org } = await getActiveContext();
    const notes = await db.note.findMany({
      where: { contactId, organizationId: org.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: notes.map((n) => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[getContactNotesAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to fetch notes." };
  }
}

/**
 * 8. Create a note for a contact
 */
export async function createContactNoteAction(contactId: string, content: string) {
  try {
    const { org, membership } = await getActiveContext();
    const note = await db.note.create({
      data: {
        organizationId: org.id,
        contactId,
        createdByMembershipId: membership.id,
        content,
      },
    });

    return {
      success: true,
      data: {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[createContactNoteAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to create note." };
  }
}
