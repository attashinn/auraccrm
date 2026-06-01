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
<body style="margin:0;padding:0;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#111111 0%,#2d2d2d 100%);padding:40px 40px 32px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <span style="color:#ffffff;font-size:20px;font-weight:900;">A</span>
          </div>
          <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">From</p>
          <h1 style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:700;">${senderOrgName}</h1>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Invoice</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:24px;font-weight:800;">${invoiceNumber}</p>
        </div>
      </div>
    </div>

    <!-- Meta row -->
    <div style="background:#f9fafb;padding:20px 40px;display:flex;gap:40px;border-bottom:1px solid #f0f0f0;">
      <div>
        <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Billed To</p>
        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${recipientName}</p>
      </div>
      <div>
        <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Issue Date</p>
        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${issueDate}</p>
      </div>
      ${
        dueDate
          ? `<div>
        <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
        <p style="margin:4px 0 0;color:#dc2626;font-size:15px;font-weight:600;">${dueDate}</p>
      </div>`
          : ""
      }
    </div>

    <!-- Items table -->
    <div style="padding:32px 40px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb;">Description</th>
            <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb;">Qty</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb;">Rate</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:24px 40px 32px;display:flex;justify-content:flex-end;">
      <div style="min-width:260px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <span style="color:#6b7280;font-size:14px;">Subtotal</span>
          <span style="color:#111827;font-size:14px;font-weight:600;">${formatCurrency(subtotal)}</span>
        </div>
        ${
          Number(taxRate) > 0
            ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <span style="color:#6b7280;font-size:14px;">Tax (${Number(taxRate)}%)</span>
          <span style="color:#111827;font-size:14px;font-weight:600;">${formatCurrency(taxAmount)}</span>
        </div>`
            : ""
        }
        <div style="display:flex;justify-content:space-between;padding:16px;margin-top:8px;background:#111827;border-radius:12px;">
          <span style="color:#ffffff;font-size:16px;font-weight:700;">Total Due</span>
          <span style="color:#ffffff;font-size:20px;font-weight:800;">${formatCurrency(total)}</span>
        </div>
      </div>
    </div>

    ${
      notes
        ? `<!-- Notes -->
    <div style="margin:0 40px 32px;padding:16px 20px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;">
      <p style="margin:0 0 4px;color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Notes</p>
      <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">${notes}</p>
    </div>`
        : ""
    }

    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">Generated by <strong style="color:#111827;">AuraCRM</strong> · Thank you for your business!</p>
    </div>
  </div>
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
    from: "AuraCRM Invoices <onboarding@resend.dev>",
    to: [to],
    subject: `Invoice ${invoiceNumber} from ${senderOrgName} — $${Number(total).toFixed(2)} Due`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
