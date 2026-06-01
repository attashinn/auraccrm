"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteInvoiceAction,
  updateInvoiceStatusAction,
  sendInvoiceEmailAction,
} from "@/actions/invoices";
import { InvoiceStatus } from "@prisma/client";
import {
  Send,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  recipientName: string | null;
  recipientEmail: string | null;
  issueDate: Date | string;
  dueDate: Date | string | null;
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  total: number | string;
  notes: string | null;
  sentAt: Date | string | null;
  items: InvoiceItem[];
  organization: { name: string };
  contact: { firstName: string; lastName: string; email: string | null } | null;
  deal: { name: string } | null;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-50 text-blue-600", icon: Mail },
  PAID: { label: "Paid", color: "bg-green-50 text-green-600", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", color: "bg-red-50 text-red-600", icon: AlertCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-50 text-gray-400", icon: XCircle },
};

function fmt(val: number | string) {
  return `$${Number(val).toFixed(2)}`;
}

function fmtDate(val: Date | string | null | undefined) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState(
    invoice.recipientEmail || invoice.contact?.email || ""
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(invoice.status);

  const cfg = statusConfig[currentStatus];
  const StatusIcon = cfg.icon;

  const handleDelete = () => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteInvoiceAction(invoice.id);
      if (res.success) router.push("/dashboard/invoices");
    });
  };

  const handleStatusChange = (status: InvoiceStatus) => {
    startTransition(async () => {
      await updateInvoiceStatusAction(invoice.id, status);
      setCurrentStatus(status);
    });
  };

  const handleSend = () => {
    setSendError(null);
    setSendSuccess(false);
    startTransition(async () => {
      const res = await sendInvoiceEmailAction(invoice.id, sendEmail || undefined);
      if (res.success) {
        setSendSuccess(true);
        setCurrentStatus("SENT");
        setTimeout(() => setShowSendModal(false), 2000);
      } else {
        setSendError(res.error || "Failed to send");
      }
    });
  };

  return (
    <>
      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Send Invoice by Email</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              Send <strong>{invoice.invoiceNumber}</strong> ({fmt(invoice.total)}) to:
            </p>
            <input
              type="email"
              className="w-full h-10 rounded-xl border border-border bg-[#F9FAF8] px-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="recipient@example.com"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
            />
            {sendError && (
              <p className="text-sm text-red-600 mb-3">{sendError}</p>
            )}
            {sendSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Invoice sent successfully!
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowSendModal(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={isPending || sendSuccess} onClick={handleSend}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview */}
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {cfg.label}
            </span>
            <select
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-foreground focus:outline-none"
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
              disabled={isPending}
            >
              {Object.entries(statusConfig).map(([val, conf]) => (
                <option key={val} value={val}>{conf.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendModal(true)}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Send Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden print:shadow-none">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#111111] to-[#2d2d2d] p-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <span className="text-white font-black text-lg">A</span>
                </div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">From</p>
                <h1 className="text-white text-2xl font-bold mt-1">{invoice.organization.name}</h1>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Invoice</p>
                <p className="text-white text-3xl font-black mt-1">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-[#f9fafb] border-b border-border px-8 py-5 flex flex-wrap gap-8">
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Billed To</p>
              <p className="text-foreground font-semibold mt-1">{invoice.recipientName || "—"}</p>
              {invoice.recipientEmail && (
                <p className="text-muted text-sm">{invoice.recipientEmail}</p>
              )}
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Issue Date</p>
              <p className="text-foreground font-semibold mt-1">{fmtDate(invoice.issueDate)}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-muted text-xs font-semibold uppercase tracking-wider">Due Date</p>
                <p className="text-red-600 font-semibold mt-1">{fmtDate(invoice.dueDate)}</p>
              </div>
            )}
            {invoice.deal && (
              <div>
                <p className="text-muted text-xs font-semibold uppercase tracking-wider">Deal</p>
                <p className="text-foreground font-semibold mt-1">{invoice.deal.name}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-8 py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left pb-3 text-xs font-bold text-muted uppercase tracking-wider">Description</th>
                  <th className="text-center pb-3 text-xs font-bold text-muted uppercase tracking-wider">Qty</th>
                  <th className="text-right pb-3 text-xs font-bold text-muted uppercase tracking-wider">Rate</th>
                  <th className="text-right pb-3 text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#f0f0f0]">
                    <td className="py-3 text-sm text-foreground">{item.description}</td>
                    <td className="py-3 text-sm text-foreground text-center">{Number(item.quantity)}</td>
                    <td className="py-3 text-sm text-foreground text-right">{fmt(item.unitPrice)}</td>
                    <td className="py-3 text-sm font-semibold text-foreground text-right">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">{fmt(invoice.subtotal)}</span>
                </div>
                {Number(invoice.taxRate) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Tax ({Number(invoice.taxRate)}%)</span>
                    <span className="font-medium">{fmt(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between p-4 bg-[#111827] text-white rounded-xl mt-2">
                  <span className="font-bold text-base">Total Due</span>
                  <span className="font-black text-lg">{fmt(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mx-8 mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-amber-900 leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-[#f9fafb] border-t border-border px-8 py-4 text-center">
            <p className="text-muted text-sm">
              Generated by <strong className="text-foreground">AuraCRM</strong> · Thank you for your business!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
