import { getInvoiceByIdAction } from "@/actions/invoices";
import { notFound } from "next/navigation";
import InvoicePreview from "../_components/InvoicePreview";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await getInvoiceByIdAction(id);

  if (!res.success || !res.invoice) {
    notFound();
  }

  const invoice = {
    ...res.invoice,
    subtotal: Number(res.invoice.subtotal),
    taxRate: Number(res.invoice.taxRate),
    taxAmount: Number(res.invoice.taxAmount),
    total: Number(res.invoice.total),
    items: res.invoice.items.map((item: { id: string; description: string; quantity: unknown; unitPrice: unknown; total: unknown; invoiceId: string }) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
        <p className="text-sm text-muted mt-1">
          Created {new Date(invoice.createdAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      </div>
      <InvoicePreview invoice={invoice} />
    </div>
  );
}
