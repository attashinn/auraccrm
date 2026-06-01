"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createInvoiceAction,
  getContactsForPickerAction,
  type InvoiceItemInput,
} from "@/actions/invoices";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  companyName: string | null;
}

interface LineItem extends InvoiceItemInput {
  id: string;
}

export default function InvoiceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedContactId, setSelectedContactId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    getContactsForPickerAction().then((res) => {
      if (res.success) setContacts(res.contacts);
    });
  }, []);

  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId);
    if (contactId) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        setRecipientName(`${contact.firstName} ${contact.lastName}`);
        setRecipientEmail(contact.email || "");
      }
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItemInput, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "unitPrice"
                  ? parseFloat(value) || 0
                  : value,
            }
          : item
      )
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const tax = (subtotal * (parseFloat(taxRate) || 0)) / 100;
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recipientName.trim()) {
      setError("Recipient name is required.");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      setError("All line items need a description.");
      return;
    }

    startTransition(async () => {
      const res = await createInvoiceAction({
        contactId: selectedContactId || undefined,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        dueDate: dueDate || undefined,
        taxRate: parseFloat(taxRate) || 0,
        notes: notes.trim() || undefined,
        items: items.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
        })),
      });

      if (res.success) {
        router.push("/dashboard/invoices");
      } else {
        setError(res.error || "Failed to create invoice");
      }
    });
  };

  const inputClass =
    "w-full h-10 rounded-xl border border-border bg-[#F9FAF8] px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Recipient Section */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Recipient Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Link to Contact (optional)
            </label>
            <select
              className={inputClass}
              value={selectedContactId}
              onChange={(e) => handleContactChange(e.target.value)}
            >
              <option value="">Select a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.companyName ? ` — ${c.companyName}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Recipient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="John Smith"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Recipient Email
            </label>
            <input
              type="email"
              className={inputClass}
              placeholder="john@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Tax Rate (%)
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Line Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-1">
            <div className="col-span-6 text-xs font-semibold text-muted uppercase tracking-wider">Description</div>
            <div className="col-span-2 text-xs font-semibold text-muted uppercase tracking-wider text-center">Qty</div>
            <div className="col-span-2 text-xs font-semibold text-muted uppercase tracking-wider text-right">Rate</div>
            <div className="col-span-2 text-xs font-semibold text-muted uppercase tracking-wider text-right">Amount</div>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-[#F9FAF8] border border-border"
            >
              <div className="col-span-12 md:col-span-6">
                <input
                  type="text"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                  placeholder="Service or product description…"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input
                  type="number"
                  className="w-full bg-transparent text-sm text-foreground text-center focus:outline-none"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-muted text-sm">$</span>
                  <input
                    type="number"
                    className="w-full bg-transparent text-sm text-foreground text-right focus:outline-none"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-2">
                <span className="text-sm font-semibold text-foreground">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            {parseFloat(taxRate) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tax ({taxRate}%)</span>
                <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Notes (optional)</h2>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-border bg-[#F9FAF8] px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all resize-none"
          placeholder="Payment terms, bank details, thank you note…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/invoices")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
          ) : (
            "Create Invoice"
          )}
        </Button>
      </div>
    </form>
  );
}
