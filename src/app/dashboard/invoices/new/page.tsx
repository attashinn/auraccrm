import InvoiceForm from "../_components/InvoiceForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewInvoicePage() {
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
        <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
        <p className="text-sm text-muted mt-1">Fill in the details and create your invoice</p>
      </div>
      <InvoiceForm />
    </div>
  );
}
