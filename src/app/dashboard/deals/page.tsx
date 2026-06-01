"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  getDealsAction,
  createDealAction,
  updateDealAction,
  updateDealStageAction,
  deleteDealAction,
} from "@/actions/deals";
import { getLeadsAction } from "@/actions/leads";
import { DealStage } from "@/lib/validations/deals";
import {
  DollarSign,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Trash2,
  Pencil,
  ArrowLeftRight,
  X,
  Link as LinkIcon,
  FolderOpen,
  Calendar,
  FileText,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DealRecord {
  id: string;
  name: string;
  value: number;
  stage: DealStage;
  leadId: string | null;
  expectedCloseDate: string | null;
  notes: string | null;
  createdAt: string;
  lead?: { id: string; firstName: string; lastName: string; company: string | null } | null;
}

interface LeadOption {
  id: string;
  firstName: string;
  lastName: string | null;
  company: string | null;
}

// ─────────────────────────────────────────────
// Stage Config
// ─────────────────────────────────────────────
const STAGES: { key: DealStage; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacting" },
  { key: "QUALIFIED", label: "Qualifying" },
  { key: "PROPOSAL", label: "Proposal sent" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function EmptyColumn({ stage }: { stage: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted text-xs h-full min-h-[140px] select-none">
      <FolderOpen className="h-6 w-6 text-muted/30" />
      <span className="text-muted/60">No deals in {stage}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function DealsPage() {
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealRecord | null>(null);

  // Detail panel state
  const [viewingDeal, setViewingDeal] = useState<DealRecord | null>(null);

  // Form fields
  const [form, setForm] = useState({
    title: "",
    value: "0",
    stage: "NEW" as DealStage,
    leadId: "",
    expectedCloseDate: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Stage mover state per deal
  const [movingDeal, setMovingDeal] = useState<string | null>(null);

  // ── Load data ──────────────────────────────
  const loadDeals = useCallback(async (searchVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDealsAction(searchVal);
      if (result.success && result.data) {
        setDeals(result.data as DealRecord[]);
      } else {
        setError(result.error || "Failed to load deals.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error loading deals.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const result = await getLeadsAction();
      if (result.success && result.data) {
        setLeads(result.data as LeadOption[]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDeals();
      loadLeads();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDeals, loadLeads]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDeals(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, loadDeals]);

  // ── Form helpers ───────────────────────────
  function openCreate() {
    setEditingDeal(null);
    setForm({ title: "", value: "0", stage: "NEW", leadId: "", expectedCloseDate: "", notes: "" });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(deal: DealRecord) {
    setEditingDeal(deal);
    setForm({
      title: deal.name,
      value: String(deal.value),
      stage: deal.stage,
      leadId: deal.leadId || "",
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : "",
      notes: deal.notes || "",
    });
    setFormError(null);
    setModalOpen(true);
    setViewingDeal(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload = {
      title: form.title,
      value: parseFloat(form.value) || 0,
      stage: form.stage,
      leadId: form.leadId || null,
      expectedCloseDate: form.expectedCloseDate || null,
      notes: form.notes || null,
    };

    try {
      if (editingDeal) {
        const result = await updateDealAction(editingDeal.id, payload);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await createDealAction(payload);
        if (!result.success) throw new Error(result.error);
      }
      setModalOpen(false);
      await loadDeals(search);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteDealAction(id);
      if (result.success) {
        setDeals((prev) => prev.filter((d) => d.id !== id));
        if (viewingDeal?.id === id) setViewingDeal(null);
      } else {
        alert(result.error || "Failed to delete deal.");
      }
    });
  }

  async function handleStageChange(id: string, newStage: DealStage) {
    setMovingDeal(id);
    try {
      const result = await updateDealStageAction(id, newStage);
      if (result.success) {
        setDeals((prev) =>
          prev.map((d) => (d.id === id ? { ...d, stage: newStage } : d))
        );
        if (viewingDeal?.id === id) setViewingDeal((v) => v ? { ...v, stage: newStage } : v);
      } else {
        alert(result.error || "Failed to move deal.");
      }
    } finally {
      setMovingDeal(null);
    }
  }

  // ──────────────────────────────────────────
  return (
    <div className="space-y-6 flex flex-col h-full bg-white p-6 md:p-8 rounded-3xl border border-border shadow-[0_4px_24px_rgba(17,17,17,0.02)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Deals Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted/80 font-semibold border border-border/80 px-3 py-1.5 rounded-full bg-[#F4F5F1]">
            0/50 open deals
          </span>
          <Button size="sm" onClick={openCreate} className="flex items-center gap-1.5 shrink-0 px-4 py-2 font-bold rounded-xl bg-foreground text-white hover:bg-foreground/90">
            Create a deal <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Brevo-style Sub-header Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-6 text-sm font-semibold">
          <button className="text-foreground border-b-2 border-primary pb-3 -mb-[14px] cursor-pointer">
            All deals
          </button>
          <button className="text-muted hover:text-foreground pb-3 -mb-[14px] cursor-pointer">
            +
          </button>
        </div>
      </div>

      {/* Filter Options bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-border p-1 bg-[#F4F5F1] select-none">
            <button className="px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-white shadow-sm text-foreground cursor-pointer">
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
            <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 text-muted hover:text-foreground cursor-pointer">
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <span className="text-xs text-muted font-bold px-2.5 py-1 rounded-full bg-border/40">
            {deals.length} deal{deals.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3.5 h-9 rounded-full border border-border bg-white text-xs font-bold text-foreground hover:bg-[#F4F5F1] transition-all flex items-center gap-1.5 cursor-pointer">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Sort
          </button>
          <button className="px-3.5 h-9 rounded-full border border-border bg-white text-xs font-bold text-foreground hover:bg-[#F4F5F1] transition-all flex items-center gap-1.5 cursor-pointer">
            <Search className="h-3.5 w-3.5 text-muted" /> Filter
          </button>
          <div className="relative w-48 xl:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-full border-border/80"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="shrink-0 flex items-center gap-3 p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => loadDeals()} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <span className="text-xs font-medium">Loading pipeline...</span>
          </div>
        </div>
      ) : (
        /* Kanban Board Area */
        <div className="flex flex-col flex-1 border border-border rounded-2xl overflow-hidden bg-white select-none">
          {/* Header Row */}
          <div className="flex divide-x divide-border/60 bg-[#fafbfa] border-b border-border/80">
            {STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);
              const stageSum = stageDeals.reduce((s, d) => s + d.value, 0);

              return (
                <div key={stage.key} className="flex-1 min-w-[200px] p-4 text-left">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-foreground tracking-tight">{stage.label}</span>
                    <span className="text-xs text-muted font-bold">{stageDeals.length}</span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1 text-xs text-muted">
                    <span>Total amount</span>
                    <span className="font-bold text-foreground">{formatCurrency(stageSum)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Columns Row */}
          <div className="flex flex-1 divide-x divide-border/60 min-h-[58vh] overflow-x-auto overflow-y-hidden">
            {STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);

              return (
                <div key={stage.key} className="flex-1 min-w-[200px] bg-white flex flex-col justify-between group">
                  <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[60vh] kanban-scrollbar">
                    {stageDeals.length === 0 ? (
                      <EmptyColumn stage={stage.label} />
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="kanban-card p-4.5 space-y-3 group cursor-pointer bg-white border border-border/80 rounded-xl hover:shadow-[0_4px_16px_rgba(17,17,17,0.04)] transition-all duration-200"
                          onClick={() => setViewingDeal(deal)}
                        >
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-foreground/90 leading-relaxed break-words hover:text-foreground transition-colors">
                              {deal.name}
                            </h4>
                            {deal.lead && (
                              <p className="text-xs text-muted truncate flex items-center gap-1">
                                <LinkIcon className="h-2.5 w-2.5 shrink-0 text-foreground/40" />
                                {deal.lead.firstName} {deal.lead.lastName}
                              </p>
                            )}
                          </div>

                          <div className="text-sm font-bold text-foreground">
                            {formatCurrency(deal.value)}
                          </div>

                          <div className="text-xs text-muted flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted/60" />
                            <span>
                              {deal.expectedCloseDate ? `Expected close: ${formatDate(deal.expectedCloseDate)}` : "No close date"}
                            </span>
                          </div>

                          {/* Choose action menu button */}
                          <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-2 flex-wrap gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewingDeal(deal); }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              Choose action
                            </button>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(deal); }}
                                className="h-5.5 w-5.5 flex items-center justify-center rounded bg-[#F4F5F1] hover:bg-primary/20 transition-colors cursor-pointer"
                              >
                                <Pencil className="h-2.5 w-2.5 text-muted" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                                className="h-5.5 w-5.5 flex items-center justify-center rounded bg-[#F4F5F1] hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-2.5 w-2.5 text-muted hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Deal Column Shortcut */}
                  <div className="p-3 border-t border-border/30 bg-[#fafbfa]/40">
                    <button
                      onClick={() => {
                        setForm((f) => ({ ...f, stage: stage.key }));
                        openCreate();
                      }}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-border/80 text-xs font-semibold text-muted/80 hover:text-foreground hover:border-border/120 hover:bg-[#F4F5F1] transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal ─────────────────── */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDeal ? "Edit Deal" : "Create New Deal"}
        description={editingDeal ? "Update this deal's details and pipeline stage." : "Add a new deal to your pipeline."}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Deal Title *</label>
            <Input
              type="text"
              placeholder="e.g. Enterprise Cloud Licensing"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          {/* Value + Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Deal Value ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Pipeline Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as DealStage }))}
                className="flex h-10 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Link to Lead */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Link to Lead (Optional)</label>
            <select
              value={form.leadId}
              onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
            >
              <option value="">— No lead linked —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.firstName} {l.lastName || ""}{l.company ? ` (${l.company})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Close Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Expected Close Date</label>
            <Input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Notes</label>
            <textarea
              rows={3}
              placeholder="Add internal notes about this deal..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none input-focus resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingDeal ? "Save Changes" : "Create Deal"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── Deal Detail Side Panel ─────────────── */}
      {viewingDeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          onClick={() => setViewingDeal(null)}
        >
          <div className="absolute inset-0 bg-[rgba(17,17,17,0.35)] backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm h-full bg-surface border-l border-border shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-foreground leading-tight truncate">{viewingDeal.name}</h2>
                {viewingDeal.lead && (
                  <p className="text-[10px] text-foreground mt-1 flex items-center gap-1 truncate">
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    {viewingDeal.lead.firstName} {viewingDeal.lead.lastName}
                    {viewingDeal.lead.company ? ` · ${viewingDeal.lead.company}` : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingDeal(null)}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-[#F4F5F1] hover:bg-[rgba(17,17,17,0.04)] transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted" />
              </button>
            </div>

            {/* Details */}
            <div className="flex-1 p-5 space-y-5">
              <div className="space-y-3">
                <DetailRow label="Deal Value" value={formatCurrency(viewingDeal.value)} highlight />
                <DetailRow
                  label="Expected Close"
                  value={viewingDeal.expectedCloseDate ? formatDate(viewingDeal.expectedCloseDate) ?? "—" : "—"}
                />
                <DetailRow label="Created" value={formatDate(viewingDeal.createdAt) ?? "—"} />
              </div>

              {viewingDeal.notes && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Notes
                  </p>
                  <p className="text-xs text-foreground leading-relaxed bg-[#F4F5F1] border border-border rounded-lg p-3 whitespace-pre-wrap">
                    {viewingDeal.notes}
                  </p>
                </div>
              )}

              {/* Move Stage */}
              <div className="space-y-2">
                <p className="text-[10px] text-muted font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3 w-3" /> Move Stage
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s.key}
                      disabled={viewingDeal.stage === s.key || movingDeal === viewingDeal.id}
                      onClick={() => handleStageChange(viewingDeal.id, s.key)}
                      className={`py-2 px-2 rounded-lg border text-[9px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${
                        viewingDeal.stage === s.key
                          ? "bg-primary border-border text-foreground cursor-default"
                          : "border-border bg-[#F4F5F1] text-muted hover:text-foreground hover:border-border hover:bg-[rgba(17,17,17,0.04)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-border flex gap-3">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(viewingDeal)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 border border-red-900/40 text-red-600 hover:bg-red-50 hover:border-red-500/30"
                onClick={() => handleDelete(viewingDeal.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border">
      <span className="text-[10px] text-muted uppercase font-bold tracking-wide">{label}</span>
      <span className={`font-bold ${highlight ? "text-lg text-foreground" : "text-xs text-muted"}`}>{value}</span>
    </div>
  );
}
