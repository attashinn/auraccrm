import { db } from "@/lib/db";
import { sendMetaTextMessage, sendMetaTemplateMessage } from "./meta-api";

interface MessagePayload {
  organizationId: string;
  contactId: string;
  conversationId: string;
  messageText: string;
  phone: string;
}

/**
 * Real-time event notifier (Pusher integration clone)
 */
async function triggerRealtimeEvent(orgId: string, eventName: string, payload: any) {
  const pusherAppId = process.env.PUSHER_APP_ID;
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherSecret = process.env.PUSHER_SECRET;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (pusherAppId && pusherKey && pusherSecret && pusherCluster) {
    try {
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
      console.error("[Automation Runner Realtime Error]:", e);
    }
  } else {
    console.log(`[Automation Runner Realtime] Channel: org-${orgId}, Event: ${eventName}`, payload);
  }
}

/**
 * Runs automations for an incoming message.
 */
export async function runAutomationsForMessage(payload: MessagePayload) {
  const { organizationId, contactId, conversationId, messageText, phone } = payload;

  console.log(`[Automation Engine] Checking automations for org ${organizationId}, contact ${contactId}`);

  // 1. Fetch active automations with steps sorted by position
  const activeAutomations = await db.automation.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      steps: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (activeAutomations.length === 0) {
    console.log("[Automation Engine] No active automations found.");
    return;
  }

  // Fetch whatsapp config for message dispatching
  const config = await db.whatsappConfig.findUnique({
    where: { organizationId },
  });

  for (const automation of activeAutomations) {
    try {
      let isMatch = false;
      const triggerConfig = (automation.triggerConfig as any) || {};

      // 2. Evaluate trigger matching
      if (automation.triggerType === "new_message") {
        isMatch = true;
      } else if (automation.triggerType === "first_message") {
        const messageCount = await db.message.count({
          where: { conversationId },
        });
        if (messageCount <= 1) {
          isMatch = true;
        }
      } else if (automation.triggerType === "keyword_match") {
        const keywords: string[] = Array.isArray(triggerConfig.keywords)
          ? triggerConfig.keywords
          : typeof triggerConfig.keywords === "string"
          ? triggerConfig.keywords.split(",").map((k: string) => k.trim())
          : [];
        const matchType = triggerConfig.matchType || "contains";

        if (keywords.length > 0) {
          const textLower = messageText.toLowerCase().trim();
          isMatch = keywords.some((kw) => {
            const kwLower = kw.toLowerCase().trim();
            if (!kwLower) return false;

            if (matchType === "exact") {
              return textLower === kwLower;
            } else if (matchType === "starts_with") {
              return textLower.startsWith(kwLower);
            } else if (matchType === "ends_with") {
              return textLower.endsWith(kwLower);
            } else {
              return textLower.includes(kwLower);
            }
          });
        }
      }

      if (!isMatch) continue;

      console.log(`[Automation Engine] Trigger matched: ${automation.name} (${automation.id})`);

      // 3. Increment stats & log run start
      await db.automation.update({
        where: { id: automation.id },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });

      const log = await db.automationLog.create({
        data: {
          automationId: automation.id,
          triggeredBy: contactId,
          status: "running",
        },
      });

      let stepsExecuted = 0;

      // 4. Run steps sequentially
      for (const step of automation.steps) {
        const stepConfig = (step.stepConfig as any) || {};

        console.log(`[Automation Engine] Executing step: ${step.stepType} (Position: ${step.position})`);

        // Send plain text message
        if (step.stepType === "send_message") {
          const rawText = stepConfig.messageText || "";
          if (rawText.trim()) {
            const contactObj = await db.contact.findUnique({ where: { id: contactId } });
            const firstName = contactObj?.firstName || "";
            const lastName = contactObj?.lastName || "";
            const body = rawText
              .replace(/{first_name}/g, firstName)
              .replace(/{last_name}/g, lastName)
              .replace(/{phone}/g, phone);

            let msgId = `bot-${Date.now()}`;

            if (config && config.accessToken && config.phoneNumberId) {
              try {
                const res = await sendMetaTextMessage(
                  config.phoneNumberId,
                  config.accessToken,
                  phone,
                  body
                );
                if (res?.messages?.[0]?.id) {
                  msgId = res.messages[0].id;
                }
              } catch (metaErr: any) {
                console.error("[Automation Engine Meta API Error]:", metaErr);
              }
            }

            const createdMsg = await db.message.create({
              data: {
                organizationId,
                conversationId,
                senderType: "bot",
                contentType: "text",
                content: body,
                status: "sent",
                messageId: msgId,
              },
            });

            await db.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });

            await triggerRealtimeEvent(organizationId, "new-message", {
              conversationId,
              message: {
                ...createdMsg,
                createdAt: createdMsg.createdAt.toISOString(),
              },
            });
          }
        } 
        // Send Meta Template message
        else if (step.stepType === "send_template") {
          const templateName = stepConfig.templateName || "";
          const language = stepConfig.language || "en_US";
          if (templateName.trim() && config && config.accessToken && config.phoneNumberId) {
            try {
              const res = await sendMetaTemplateMessage(
                config.phoneNumberId,
                config.accessToken,
                phone,
                templateName.trim(),
                language
              );
              
              const createdMsg = await db.message.create({
                data: {
                  organizationId,
                  conversationId,
                  senderType: "bot",
                  contentType: "template",
                  content: `[Template message sent: ${templateName}]`,
                  status: "sent",
                  messageId: res?.messages?.[0]?.id || `bot-template-${Date.now()}`,
                },
              });

              await triggerRealtimeEvent(organizationId, "new-message", {
                conversationId,
                message: {
                  ...createdMsg,
                  createdAt: createdMsg.createdAt.toISOString(),
                },
              });
            } catch (metaErr: any) {
              console.error("[Automation Engine Template Error]:", metaErr);
            }
          }
        }
        // Add Contact Tag
        else if (step.stepType === "add_tag") {
          const tagName = stepConfig.tagName || "";
          if (tagName.trim()) {
            const tag = await db.tag.upsert({
              where: {
                organizationId_name: {
                  organizationId,
                  name: tagName.trim(),
                },
              },
              create: {
                organizationId,
                name: tagName.trim(),
              },
              update: {},
            });

            await db.contactTag.upsert({
              where: {
                contactId_tagId: {
                  contactId,
                  tagId: tag.id,
                },
              },
              create: {
                contactId,
                tagId: tag.id,
              },
              update: {},
            });
          }
        } 
        // Remove Contact Tag
        else if (step.stepType === "remove_tag") {
          const tagName = stepConfig.tagName || "";
          if (tagName.trim()) {
            const tag = await db.tag.findFirst({
              where: { organizationId, name: tagName.trim() },
            });
            if (tag) {
              await db.contactTag.deleteMany({
                where: {
                  contactId,
                  tagId: tag.id,
                },
              });
            }
          }
        } 
        // Assign Conversation to Member/Agent
        else if (step.stepType === "assign_conversation") {
          const agentId = stepConfig.assignedAgentId || "";
          if (agentId) {
            await db.conversation.update({
              where: { id: conversationId },
              data: { assignedAgentId: agentId },
            });
          }
        } 
        // Update Contact Field (Custom Field Value)
        else if (step.stepType === "update_field") {
          const fieldName = stepConfig.fieldName || "";
          const fieldValue = stepConfig.fieldValue || "";
          if (fieldName.trim()) {
            // Find or create custom field
            const customField = await db.customField.upsert({
              where: {
                organizationId_name: {
                  organizationId,
                  name: fieldName.trim(),
                },
              },
              create: {
                organizationId,
                name: fieldName.trim(),
                type: "text",
              },
              update: {},
            });

            // Upsert contact custom field value
            await db.contactCustomValue.upsert({
              where: {
                contactId_customFieldId: {
                  contactId,
                  customFieldId: customField.id,
                },
              },
              create: {
                contactId,
                customFieldId: customField.id,
                value: fieldValue,
              },
              update: {
                value: fieldValue,
              },
            });
          }
        } 
        // Create Deal
        else if (step.stepType === "create_deal") {
          const dealName = stepConfig.dealName || `Deal ${Date.now()}`;
          const dealValue = parseFloat(stepConfig.dealValue) || 0.0;
          const dealStage = stepConfig.dealStage || "NEW";

          await db.deal.create({
            data: {
              organizationId,
              contactId,
              name: dealName,
              value: dealValue,
              stage: dealStage,
            },
          });
        } 
        // Wait/Delay
        else if (step.stepType === "wait_delay") {
          const delayValue = parseInt(stepConfig.delayValue) || 1;
          const delayUnit = stepConfig.delayUnit || "minutes";
          
          let nextExecutionAt = new Date();
          if (delayUnit === "minutes") {
            nextExecutionAt.setMinutes(nextExecutionAt.getMinutes() + delayValue);
          } else if (delayUnit === "hours") {
            nextExecutionAt.setHours(nextExecutionAt.getHours() + delayValue);
          } else {
            nextExecutionAt.setDate(nextExecutionAt.getDate() + delayValue);
          }

          // Create pending delayed execution
          await db.automationPendingExecution.create({
            data: {
              automationId: automation.id,
              contactId,
              nextExecutionAt,
              scheduledConfig: stepConfig,
            },
          });

          console.log(`[Automation Engine] Wait step configured: delay ${delayValue} ${delayUnit}. Queued execution for ${nextExecutionAt}`);
        } 
        // Outbound Webhook
        else if (step.stepType === "send_webhook") {
          const webhookUrl = stepConfig.webhookUrl || "";
          const payloadText = stepConfig.payloadText || "";
          if (webhookUrl.startsWith("http")) {
            try {
              let parsedBody = {};
              try {
                parsedBody = payloadText ? JSON.parse(payloadText) : {};
              } catch {
                parsedBody = { text: payloadText, contactId, phone };
              }

              fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsedBody),
              }).catch((e) => console.error("[Outbound Webhook Async Error]:", e));
            } catch (err) {
              console.error("[Outbound Webhook Execute Error]:", err);
            }
          }
        } 
        // Close Conversation
        else if (step.stepType === "close_conversation") {
          await db.conversation.update({
            where: { id: conversationId },
            data: { status: "closed" },
          });
        }

        stepsExecuted++;
      }

      // 5. Update log status to success
      await db.automationLog.update({
        where: { id: log.id },
        data: {
          status: "success",
        },
      });

    } catch (automationError: any) {
      console.error(`[Automation Engine ERROR in workflow ${automation.name}]:`, automationError);
      
      await db.automationLog.create({
        data: {
          automationId: automation.id,
          triggeredBy: contactId,
          status: "failed",
          errorMessage: automationError.message || "Internal Step Error",
        },
      });
    }
  }
}
