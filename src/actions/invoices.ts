"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendInvoiceEmail } from "@/lib/email";
import { InvoiceStatus } from "@prisma/client";

async function getOrgId(): Promise<string> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No organization selected");
  return orgId;
}

async function resolveOrganizationDbId(clerkOrgId: string): Promise<string> {
  const org = await db.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { id: true },
  });
  if (!org) throw new Error("Organization not found");
  return org.id;
}

// ─── Generate invoice number ────────────────────────────────────────────────
async function generateInvoiceNumber(orgDbId: string): Promise<string> {
  const count = await db.invoice.count({ where: { organizationId: orgDbId } });
  const num = String(count + 1).padStart(4, "0");
  return `INV-${num}`;
}

// ─── Create Invoice ─────────────────────────────────────────────────────────
export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  contactId?: string;
  dealId?: string;
  recipientName: string;
  recipientEmail?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  items: InvoiceItemInput[];
}

export async function createInvoiceAction(input: CreateInvoiceInput) {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);
    const invoiceNumber = await generateInvoiceNumber(orgDbId);

    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = input.taxRate ?? 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const invoice = await db.invoice.create({
      data: {
        organizationId: orgDbId,
        contactId: input.contactId || null,
        dealId: input.dealId || null,
        invoiceNumber,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes || null,
        taxRate,
        subtotal,
        taxAmount,
        total,
        items: {
          create: input.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true, invoice };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ─── Get all invoices ────────────────────────────────────────────────────────
export async function getInvoicesAction() {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);

    const invoices = await db.invoice.findMany({
      where: { organizationId: orgDbId },
      include: {
        contact: { select: { firstName: true, lastName: true, email: true } },
        deal: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, invoices };
  } catch (error) {
    return { success: false, error: (error as Error).message, invoices: [] };
  }
}

// ─── Get single invoice ──────────────────────────────────────────────────────
export async function getInvoiceByIdAction(invoiceId: string) {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgDbId },
      include: {
        contact: true,
        deal: true,
        items: true,
        organization: { select: { name: true } },
      },
    });

    if (!invoice) return { success: false, error: "Invoice not found" };
    return { success: true, invoice };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ─── Update invoice status ───────────────────────────────────────────────────
export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceStatus
) {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);

    await db.invoice.updateMany({
      where: { id: invoiceId, organizationId: orgDbId },
      data: { status },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ─── Delete invoice ──────────────────────────────────────────────────────────
export async function deleteInvoiceAction(invoiceId: string) {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);

    await db.invoice.deleteMany({
      where: { id: invoiceId, organizationId: orgDbId },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ─── Send invoice email ──────────────────────────────────────────────────────
export async function sendInvoiceEmailAction(
  invoiceId: string,
  overrideEmail?: string
) {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgDbId },
      include: {
        items: true,
        organization: { select: { name: true } },
        contact: { select: { email: true } },
      },
    });

    if (!invoice) return { success: false, error: "Invoice not found" };

    const toEmail =
      overrideEmail ||
      invoice.recipientEmail ||
      invoice.contact?.email;

    if (!toEmail) {
      return { success: false, error: "No recipient email address found. Please add an email before sending." };
    }

    await sendInvoiceEmail({
      to: toEmail,
      recipientName: invoice.recipientName || "Valued Client",
      senderOrgName: invoice.organization.name,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      }),
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })
        : undefined,
      items: invoice.items.map((item: { description: string; quantity: unknown; unitPrice: unknown; total: unknown }) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes || undefined,
    });

    // Mark as SENT
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT", sentAt: new Date() },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ─── Get contacts for picker ─────────────────────────────────────────────────
export async function getContactsForPickerAction() {
  try {
    const clerkOrgId = await getOrgId();
    const orgDbId = await resolveOrganizationDbId(clerkOrgId);

    const contacts = await db.contact.findMany({
      where: { organizationId: orgDbId },
      select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
      orderBy: { firstName: "asc" },
    });

    return { success: true, contacts };
  } catch (error) {
    return { success: false, error: (error as Error).message, contacts: [] };
  }
}
