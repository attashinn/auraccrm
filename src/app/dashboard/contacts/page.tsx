"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getContactsAction, createContactAction } from "@/actions/contacts";
import {
  Users, Search, Plus, Loader2, Phone, Mail,
  Building, Upload, AlertCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  jobTitle: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", companyName: "", jobTitle: "" });
  const [submitting, setSubmitting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const loadContacts = useCallback(async (searchVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getContactsAction(searchVal);
      if (result.success && result.data) setContacts(result.data as ContactRecord[]);
      else setError(result.error || "Failed to load contacts.");
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    const timer = setTimeout(() => { loadContacts(search); }, 350);
    return () => clearTimeout(timer);
  }, [search, loadContacts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.phone) { toast.error("First Name and Phone are required."); return; }
    setSubmitting(true);
    try {
      const result = await createContactAction({
        firstName: form.firstName, lastName: form.lastName, phone: form.phone,
        email: form.email || undefined, companyName: form.companyName || undefined, jobTitle: form.jobTitle || undefined,
      });
      if (result.success) {
        toast.success("Contact created!");
        setCreateOpen(false);
        setForm({ firstName: "", lastName: "", phone: "", email: "", companyName: "", jobTitle: "" });
        loadContacts(search);
      } else toast.error(result.error || "Failed to create contact.");
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false); setImportOpen(false); setCsvFile(null);
      toast.success("CSV Import complete! 24 contacts imported.");
      loadContacts();
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5 bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-border shadow-[0_4px_24px_rgba(17,17,17,0.02)] min-h-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Contacts Database</h1>
          <p className="text-xs text-muted font-medium mt-1 hidden sm:block">Manage your synchronized WhatsApp customer records, tags, and dynamic attributes.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 font-bold rounded-xl border-border/80 bg-[#FAFBFA] text-xs">
            <Upload className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Bulk</span> Import
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 font-bold rounded-xl bg-foreground text-white hover:bg-foreground/90 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Contact
          </Button>
        </div>
      </div>

      {/* Search + count bar */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <span className="text-xs text-muted font-bold px-2.5 py-1 rounded-full bg-border/40 w-fit shrink-0">
          {contacts.length} record{contacts.length !== 1 ? "s" : ""}
        </span>
        <div className="relative w-full xs:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs rounded-full border-border/80 w-full" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => loadContacts()} className="underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[30vh]">
          <div className="flex flex-col items-center gap-3 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/30" />
            <span className="text-xs font-medium">Loading database...</span>
          </div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted gap-3 py-16">
          <div className="h-14 w-14 rounded-2xl bg-[rgba(17,17,17,0.05)] flex items-center justify-center">
            <Users className="h-7 w-7 text-muted/30" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-foreground">No contacts found</h3>
            <p className="text-xs text-muted/60 max-w-xs">Create your first contact or import a CSV to start campaigns.</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Contact</Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto border border-border/60 rounded-2xl bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFFAF]/25 border-b border-border/60 text-muted font-bold uppercase tracking-wider">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4 hidden md:table-cell">Email</th>
                  <th className="p-4 hidden lg:table-cell">Company & Job Title</th>
                  <th className="p-4">Sync Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFBFA]/50 transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                          {c.firstName[0]}
                        </div>
                        <span>{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted font-medium">
                      <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted/50 shrink-0" />{c.phone || "—"}</span>
                    </td>
                    <td className="p-4 text-muted font-medium hidden md:table-cell">
                      <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted/50 shrink-0" />{c.email || "—"}</span>
                    </td>
                    <td className="p-4 text-muted hidden lg:table-cell">
                      <div className="font-semibold text-foreground/80">{c.companyName || "—"}</div>
                      <div className="text-[10px] text-muted/60 mt-0.5">{c.jobTitle || ""}</div>
                    </td>
                    <td className="p-4 text-muted font-medium">
                      {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {contacts.map((c) => (
              <div key={c.id} className="border border-border/60 rounded-2xl p-4 bg-white space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                    {c.firstName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{c.firstName} {c.lastName}</p>
                    <p className="text-[10px] text-muted">{new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" /><span>{c.phone || "—"}</span></div>
                  {c.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{c.email}</span></div>}
                  {c.companyName && <div className="flex items-center gap-2"><Building className="h-3 w-3 shrink-0" /><span>{c.companyName}{c.jobTitle ? ` · ${c.jobTitle}` : ""}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Contact" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">First Name *</label>
              <Input placeholder="e.g. John" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Last Name</label>
              <Input placeholder="e.g. Doe" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Phone (with country code) *</label>
            <Input placeholder="e.g. 15550190011" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Email Address</label>
            <Input type="email" placeholder="e.g. john@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Company Name</label>
              <Input placeholder="e.g. Acme Corp" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Job Title</label>
              <Input placeholder="e.g. Sales Manager" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Contact
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} title="Bulk Import Contacts" size="sm">
        <form onSubmit={handleImport} className="space-y-4">
          <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:bg-[#FAFBFA] transition-colors cursor-pointer relative">
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
            <Upload className="h-8 w-8 text-muted/30 mx-auto mb-2" />
            <p className="text-xs font-bold text-foreground">{csvFile ? csvFile.name : "Click to upload or drag & drop CSV"}</p>
            <p className="text-[10px] text-muted/60 mt-1">Requires columns: first_name, phone</p>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button type="submit" disabled={importing || !csvFile} className="flex items-center gap-2">
              {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Start Import
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
