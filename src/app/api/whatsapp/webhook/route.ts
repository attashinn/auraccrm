import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/whatsapp/webhook-signature";
import { runAutomationsForMessage } from "@/lib/whatsapp/automation-runner";

// GET handler for Webhook verification from Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    const isGlobalMatch = token === process.env.NEXT_PUBLIC_META_VERIFY_TOKEN;
    
    // Also check if any organization configured this specific verify token
    const dbConfigMatch = await db.whatsappConfig.findFirst({
      where: { verifyToken: token },
    });

    if (isGlobalMatch || dbConfigMatch) {
      console.log("[WhatsApp Webhook Verified]");
      return new Response(challenge, { status: 200 });
    }
  }

  console.error("[WhatsApp Webhook Verification Failed]: Token mismatch");
  return new Response("Forbidden", { status: 403 });
}

// POST handler to receive incoming message events from Meta
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // 1. Verify Meta signature to ensure webhook security
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Skip verification messages or changes that are not message-related
    if (payload.object !== "whatsapp_business_account" || !payload.entry) {
      return NextResponse.json({ success: true, message: "Ignored payload" });
    }

    for (const entry of payload.entry) {
      const wabaId = entry.id;
      
      for (const change of entry.changes) {
        const value = change.value;
        if (!value || change.field !== "messages") continue;

        const phoneId = value.metadata?.phone_number_id;
        
        // Find corresponding configuration
        const config = await db.whatsappConfig.findFirst({
          where: {
            OR: [
              { phoneNumberId: phoneId },
              { wabaId: wabaId }
            ]
          }
        });

        if (!config) {
          console.warn(`[WhatsApp Webhook]: Received message for unconfigured Phone ID: ${phoneId}`);
          continue;
        }

        const orgId = config.organizationId;

        // 2. Handle Status Updates (sent, delivered, read, failed)
        if (value.statuses && value.statuses.length > 0) {
          for (const statusObj of value.statuses) {
            const wamid = statusObj.id;
            const messageStatus = statusObj.status; // sent | delivered | read | failed
            const errorObj = statusObj.errors?.[0];

            await db.message.updateMany({
              where: {
                organizationId: orgId,
                messageId: wamid,
              },
              data: {
                status: messageStatus,
                errorMessage: errorObj ? errorObj.message : null,
              },
            });

            // Trigger Pusher/WS Realtime event if config is available
            await triggerRealtimeEvent(orgId, "message-status", {
              messageId: wamid,
              status: messageStatus,
            });
          }
        }

        // 3. Handle Inbound Messages (text, interactive, media, etc.)
        if (value.messages && value.messages.length > 0) {
          for (const rawMessage of value.messages) {
            const from = rawMessage.from; // Customer phone number
            const wamid = rawMessage.id;
            const msgType = rawMessage.type;
            const timestamp = new Date(parseInt(rawMessage.timestamp) * 1000);

            // Deduplication check
            const existingMsg = await db.message.findUnique({
              where: { messageId: wamid },
            });
            if (existingMsg) continue;

            // Resolve contact metadata
            const profile = value.contacts?.find((c: any) => c.wa_id === from);
            const customerName = profile?.profile?.name || `WhatsApp Contact ${from.slice(-4)}`;

            // Look up or create contact
            let contact = await db.contact.findFirst({
              where: {
                organizationId: orgId,
                phone: from,
              },
            });

            if (!contact) {
              const nameParts = customerName.split(" ");
              const firstName = nameParts[0] || "Customer";
              const lastName = nameParts.slice(1).join(" ") || "Contact";

              contact = await db.contact.create({
                data: {
                  organizationId: orgId,
                  firstName,
                  lastName,
                  phone: from,
                },
              });
            }

            // Look up or create conversation thread
            let conversation = await db.conversation.findUnique({
              where: {
                organizationId_contactId: {
                  organizationId: orgId,
                  contactId: contact.id,
                },
              },
            });

            if (!conversation) {
              conversation = await db.conversation.create({
                data: {
                  organizationId: orgId,
                  contactId: contact.id,
                  status: "open",
                  unreadCount: 1,
                },
              });
            } else {
              await db.conversation.update({
                where: { id: conversation.id },
                data: {
                  unreadCount: { increment: 1 },
                  updatedAt: new Date(),
                },
              });
            }

            // Parse message content body
            let contentBody = "";
            let interactiveReplyId: string | null = null;
            let metadataJson: any = {};

            if (msgType === "text") {
              contentBody = rawMessage.text?.body || "";
            } else if (msgType === "interactive") {
              const responseType = rawMessage.interactive?.type;
              if (responseType === "button_reply") {
                contentBody = rawMessage.interactive?.button_reply?.title || "";
                interactiveReplyId = rawMessage.interactive?.button_reply?.id || null;
              } else if (responseType === "list_reply") {
                contentBody = rawMessage.interactive?.list_reply?.title || "";
                interactiveReplyId = rawMessage.interactive?.list_reply?.id || null;
                metadataJson.description = rawMessage.interactive?.list_reply?.description;
              }
            } else if (["image", "video", "document", "audio", "voice"].includes(msgType)) {
              contentBody = `[Media attachment: ${msgType}]`;
              const mediaObj = rawMessage[msgType];
              metadataJson.mediaId = mediaObj?.id;
              metadataJson.mimeType = mediaObj?.mime_type;
              metadataJson.caption = mediaObj?.caption;
            } else if (msgType === "location") {
              contentBody = "[Shared location]";
              metadataJson.latitude = rawMessage.location?.latitude;
              metadataJson.longitude = rawMessage.location?.longitude;
              metadataJson.name = rawMessage.location?.name;
              metadataJson.address = rawMessage.location?.address;
            } else {
              contentBody = `[Unsupported message type: ${msgType}]`;
            }

            // Write to database
            const createdMessage = await db.message.create({
              data: {
                organizationId: orgId,
                conversationId: conversation.id,
                senderType: "customer",
                contentType: msgType,
                content: contentBody,
                status: "read",
                messageId: wamid,
                interactiveReplyId,
                metadata: metadataJson,
                createdAt: timestamp,
              },
            });

            // Trigger realtime notification to browser Client UI
            await triggerRealtimeEvent(orgId, "new-message", {
              conversationId: conversation.id,
              message: {
                ...createdMessage,
                createdAt: createdMessage.createdAt.toISOString(),
              },
            });

            // Execute workflows/automations asynchronously
            runAutomationsForMessage({
              organizationId: orgId,
              contactId: contact.id,
              conversationId: conversation.id,
              messageText: contentBody,
              phone: from,
            }).catch((err) => {
              console.error("[Webhook Automation Error]:", err);
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[WhatsApp Webhook ERROR]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Triggers a real-time event.
 * In a fully configured setup, this sends events to Pusher, socket.io, or SSE.
 * Here, we log the broadcast and simulate the dispatch so it works out-of-the-box.
 */
async function triggerRealtimeEvent(orgId: string, eventName: string, payload: any) {
  // If Pusher keys are defined in environment, trigger them dynamically:
  const pusherAppId = process.env.PUSHER_APP_ID;
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherSecret = process.env.PUSHER_SECRET;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (pusherAppId && pusherKey && pusherSecret && pusherCluster) {
    try {
      // Lazy load Pusher to keep start times fast
      const Pusher = (await import("pusher")).default;
      const pusher = new Pusher({
        appId: pusherAppId,
        key: pusherKey,
        secret: pusherSecret,
        cluster: pusherCluster,
        useTLS: true,
      });

      await pusher.trigger(`org-${orgId}`, eventName, payload);
    } catch (e) {
      console.error("[Realtime Broker Error]: Failed to dispatch to Pusher:", e);
    }
  } else {
    // Falls back to logging
    console.log(`[Realtime Broadcast] Channel: org-${orgId}, Event: ${eventName}`, payload);
  }
}
