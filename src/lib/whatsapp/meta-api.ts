import { decryptToken } from "./encryption";

interface MetaMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

/**
 * Helper to make signed requests to Meta Graph API
 */
async function sendMetaRequest(
  phoneNumberId: string,
  accessToken: string,
  payload: Record<string, any>
): Promise<MetaMessageResponse> {
  const decryptedToken = decryptToken(accessToken);
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${decryptedToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      ...payload,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMessage = errorJson?.error?.message || response.statusText;
    throw new Error(`Meta API Error: ${errorMessage} (Code: ${errorJson?.error?.code || response.status})`);
  }

  return response.json() as Promise<MetaMessageResponse>;
}

/**
 * Sends a plain text message to a contact
 */
export async function sendMetaTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string
) {
  return sendMetaRequest(phoneNumberId, accessToken, {
    recipient_type: "individual",
    to,
    type: "text",
    text: { body },
  });
}

/**
 * Sends a Meta-approved Template message
 */
export async function sendMetaTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string = "en_US",
  components: any[] = []
) {
  return sendMetaRequest(phoneNumberId, accessToken, {
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

/**
 * Sends an interactive quick reply button menu (up to 3 buttons)
 */
export async function sendMetaInteractiveButtons(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  headerText?: string,
  footerText?: string
) {
  const formattedButtons = buttons.map((btn) => ({
    type: "reply",
    reply: {
      id: btn.id,
      title: btn.title.slice(0, 20), // Meta limit is 20 chars
    },
  }));

  const interactive: Record<string, any> = {
    type: "button",
    body: { text: bodyText },
    action: { buttons: formattedButtons },
  };

  if (headerText) {
    interactive.header = { type: "text", text: headerText };
  }
  if (footerText) {
    interactive.footer = { text: footerText };
  }

  return sendMetaRequest(phoneNumberId, accessToken, {
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive,
  });
}

/**
 * Sends an interactive list menu (up to 10 options)
 */
export async function sendMetaInteractiveList(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title?: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  headerText?: string,
  footerText?: string
) {
  const interactive: Record<string, any> = {
    type: "list",
    body: { text: bodyText },
    action: {
      button: buttonText.slice(0, 20), // Meta limit is 20 chars
      sections: sections.map((sec) => ({
        title: sec.title || "Options",
        rows: sec.rows.map((row) => ({
          id: row.id,
          title: row.title.slice(0, 24), // Meta limit is 24 chars
          description: row.description?.slice(0, 72), // Meta limit is 72 chars
        })),
      })),
    },
  };

  if (headerText) {
    interactive.header = { type: "text", text: headerText };
  }
  if (footerText) {
    interactive.footer = { text: footerText };
  }

  return sendMetaRequest(phoneNumberId, accessToken, {
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive,
  });
}

/**
 * Registers a phone number with Meta Cloud API using a 6-digit PIN
 */
export async function registerMetaPhoneNumber(
  phoneNumberId: string,
  accessToken: string,
  pin: string
) {
  const decryptedToken = decryptToken(accessToken);
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${decryptedToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMessage = errorJson?.error?.message || response.statusText;
    throw new Error(`Meta API Error: ${errorMessage} (Code: ${errorJson?.error?.code || response.status})`);
  }

  return response.json();
}
