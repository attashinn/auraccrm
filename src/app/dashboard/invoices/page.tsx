import React from "react";
import { getInvoicesAction } from "@/actions/invoices";
import Link from "next/link";
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Mail,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@prisma/client";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-500", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-50 text-blue-600", icon: Mail },
  PAID: { label: "Paid", color: "bg-green-50 text-green-600", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", color: "bg-red-50 text-red-600", icon: AlertCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-50 text-gray-400", icon: XCircle },
};

function fmt(val: number | string) {
  return `$${Number(val).toFixed(2)}`;
}

function fmtDate(val: Date | string | null | undefined) {
  if (!val) return null;
  return new Date(val).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default async function InvoicesPage() {
  const { invoices = [] } = await getInvoicesAction();

  const totalRevenue = (invoices as unknown as Array<{ status: string; total: { toString(): string } }>)
    .filter((inv) => inv.status === "PAID")
    .reduce((sum: number, inv) => sum + Number(inv.total.toString()), 0);

  const outstanding = (invoices as unknown as Array<{ status: string; total: { toString(): string } }>)
    .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
    .reduce((sum: number, inv) => sum + Number(inv.total.toString()), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted text-sm mt-1">Create and send invoices to your clients</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Invoices</p>
          <p className="text-3xl font-black text-foreground mt-2">{invoices.length}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Revenue Collected</p>
          <p className="text-3xl font-black text-green-600 mt-2">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Outstanding</p>
          <p className="text-3xl font-black text-amber-500 mt-2">{fmt(outstanding)}</p>
        </div>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-16 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#F4F5F1] flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-muted" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No invoices yet</h3>
          <p className="text-sm text-muted mb-6 max-w-xs">
            Create your first invoice and send it directly to your client&apos;s email.
          </p>
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-[#F9FAF8]">
            <div className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider">Invoice #</div>
            <div className="col-span-3 text-xs font-bold text-muted uppercase tracking-wider">Client</div>
            <div className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider">Status</div>
            <div className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider">Due Date</div>
            <div className="col-span-2 text-xs font-bold text-muted uppercase tracking-wider text-right">Amount</div>
            <div className="col-span-1" />
          </div>

          {invoices.map((invoice) => {
            const cfg = statusConfig[invoice.status as InvoiceStatus];
            const StatusIcon = cfg.icon;
            return (
              <Link
                key={invoice.id}
                href={`/dashboard/invoices/${invoice.id}`}
                className="block border-b border-border last:border-0 hover:bg-[#F9FAF8] transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  <div className="col-span-6 md:col-span-2">
                    <span className="text-sm font-bold text-foreground">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {invoice.recipientName || "—"}
                    </p>
                    {invoice.contact && (
                      <p className="text-xs text-muted truncate">
                        {invoice.contact.firstName} {invoice.contact.lastName}
                      </p>
                    )}
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-sm text-muted">
                      {fmtDate(invoice.dueDate) || "No due date"}
                    </span>
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right">
                    <span className="text-sm font-bold text-foreground">{fmt(String(invoice.total))}</span>
                  </div>
                  <div className="hidden md:flex col-span-1 justify-end">
                    <span className="text-muted text-xs">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
