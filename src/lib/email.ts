import { Resend } from "resend";


interface InvoiceItem {
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

interface SendInvoiceEmailParams {
  to: string;
  recipientName: string;
  senderOrgName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  total: number | string;
  notes?: string;
}

function formatCurrency(value: number | string): string {
  return `$${Number(value).toFixed(2)}`;
}

function buildInvoiceHTML(params: SendInvoiceEmailParams): string {
  const {
    recipientName,
    senderOrgName,
    invoiceNumber,
    issueDate,
    dueDate,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes,
  } = params;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;">${item.description}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;text-align:center;">${Number(item.quantity)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;text-align:right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;text-align:right;font-weight:600;">${formatCurrency(item.total)}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Invoice ${invoiceNumber}</title></head>
<body style="margin:0;padding:0;background:#f6f8fa;font-family:Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f8fa;">
    <tr>
      <td style="padding:40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:40px 40px 32px;color:#ffffff;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:top;">
                    <div style="width:44px;height:44px;background:#333333;border-radius:8px;text-align:center;line-height:44px;margin-bottom:16px;">
                      <span style="color:#ffffff;font-size:20px;font-weight:900;">A</span>
                    </div>
                    <p style="margin:0 0 4px 0;color:#999999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">From</p>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${senderOrgName}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <p style="margin:0 0 4px 0;color:#666666;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Invoice</p>
                    <p style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">${invoiceNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta row -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-bottom:1px solid #f0f0f0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width:33%;padding-right:20px;vertical-align:top;">
                    <p style="margin:0 0 4px 0;color:#999999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Billed To</p>
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${recipientName}</p>
                  </td>
                  <td style="width:33%;padding:0 20px;vertical-align:top;">
                    <p style="margin:0 0 4px 0;color:#999999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Issue Date</p>
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${issueDate}</p>
                  </td>
                  <td style="width:34%;padding-left:20px;vertical-align:top;">
                    <p style="margin:0 0 4px 0;color:#999999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
                    <p style="margin:0;color:#dc2626;font-size:14px;font-weight:600;">${dueDate || "N/A"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items table -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <thead>
                  <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                    <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
                    <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                    <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Rate</th>
                    <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="color:#6b7280;font-size:14px;">Subtotal</td>
                              <td style="text-align:right;color:#111827;font-size:14px;font-weight:600;">${formatCurrency(subtotal)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${
                        Number(taxRate) > 0
                          ? `<tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="color:#6b7280;font-size:14px;">Tax (${Number(taxRate)}%)</td>
                              <td style="text-align:right;color:#111827;font-size:14px;font-weight:600;">${formatCurrency(taxAmount)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding:16px;margin-top:8px;background:#111827;border-radius:8px;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="color:#ffffff;font-size:16px;font-weight:700;">Total Due</td>
                              <td style="text-align:right;color:#ffffff;font-size:20px;font-weight:800;">${formatCurrency(total)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            notes
              ? `<!-- Notes -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="padding:16px 20px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;">
                <p style="margin:0 0 8px 0;color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Notes</p>
                <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">${notes}</p>
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;color:#999999;font-size:13px;">Generated by <strong style="color:#111827;">AuraCRM</strong> · Thank you for your business!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const { to, recipientName, senderOrgName, invoiceNumber, total } = params;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not defined in the environment variables.");
  }
  const resend = new Resend(apiKey);

  const html = buildInvoiceHTML(params);

  const { data, error } = await resend.emails.send({
    from: "AuraCRM Invoices <invoices@auracrm.brnnd.com>",
    to: [to],
    subject: `Invoice ${invoiceNumber} from ${senderOrgName} — $${Number(total).toFixed(2)} Due`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
