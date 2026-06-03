"use client";

import React, { useState } from "react";
import {
  Megaphone, Plus, Send, ChevronRight, Loader2,
  BarChart3, List, Archive, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type BroadcastTab = "campaigns" | "analytics" | "archived";

const NAV_ITEMS: { id: BroadcastTab; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "campaigns",  label: "Campaigns",  description: "All broadcast campaigns",    icon: List },
  { id: "analytics",  label: "Analytics",  description: "Delivery & engagement stats", icon: BarChart3 },
  { id: "archived",   label: "Archived",   description: "Past completed broadcasts",   icon: Archive },
];

interface CampaignRecord {
  id: string; name: string; templateName: string;
  status: "sent" | "draft" | "scheduled" | "sending";
  sentCount: number; readCount: number; repliedCount: number; sentAt: string;
}

const INITIAL_CAMPAIGNS: CampaignRecord[] = [
  { id: "1", name: "Summer Offer Promo",           templateName: "summer_sale_2026", status: "sent",      sentCount: 154, readCount: 142, repliedCount: 38,  sentAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "2", name: "Followup Lead Re-engagement",  templateName: "lead_followup_v2", status: "sent",      sentCount: 88,  readCount: 81,  repliedCount: 22,  sentAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: "3", name: "Utility Maintenance Notice",   templateName: "service_update",   status: "scheduled", sentCount: 310, readCount: 0,   repliedCount: 0,   sentAt: new Date(Date.now() + 3600000 * 24).toISOString() },
];

const STATUS_STYLES: Record<string, string> = {
  sent:      "bg-green-50 text-green-700 border-green-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  draft:     "bg-amber-50 text-amber-700 border-amber-200",
  sending:   "bg-purple-50 text-purple-700 border-purple-200",
};

export default function BroadcastsPage() {
  const [activeTab, setActiveTab] = useState<BroadcastTab>("campaigns");
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(INITIAL_CAMPAIGNS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", template: "", audience: "all" });
  const [sending, setSending] = useState(false);

  const triggerBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false); setWizardOpen(false);
      const nc: CampaignRecord = { id: String(campaigns.length + 1), name: formData.name || "Untitled Broadcast", templateName: formData.template || "default_hello", status: "sent", sentCount: 140, readCount: 120, repliedCount: 15, sentAt: new Date().toISOString() };
      setCampaigns([nc, ...campaigns]);
      toast.success("Broadcast dispatched!"); setStep(1); setFormData({ name: "", template: "", audience: "all" });
    }, 1500);
  };

  const totalSent    = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalRead    = campaigns.reduce((s, c) => s + c.readCount, 0);
  const totalReplied = campaigns.reduce((s, c) => s + c.repliedCount, 0);

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] rounded-3xl border border-border bg-white shadow-[0_4px_32px_rgba(17,17,17,0.04)] overflow-hidden">

      {/* ── Left Nav Panel ── */}
      <aside className="w-56 shrink-0 border-r border-border bg-[#FAFBFA] flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">Broadcasts</p>
              <p className="text-[10px] text-muted font-medium">WhatsApp campaigns</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all group ${active ? "bg-foreground text-white shadow-sm" : "text-muted hover:bg-[rgba(17,17,17,0.05)] hover:text-foreground"}`}>
                <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? "bg-white/15" : "bg-[rgba(17,17,17,0.06)] group-hover:bg-[rgba(17,17,17,0.09)]"}`}>
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-muted group-hover:text-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${active ? "text-white" : "text-foreground"}`}>{item.label}</p>
                  <p className={`text-[9px] truncate mt-0.5 ${active ? "text-white/60" : "text-muted"}`}>{item.description}</p>
                </div>
                {active && <ChevronRight className="h-3 w-3 text-white/60 shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button onClick={() => setWizardOpen(true)} className="w-full flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-foreground text-white hover:bg-foreground/90">
            <Plus className="h-3.5 w-3.5" /> Create Broadcast
          </Button>
        </div>
      </aside>

      {/* ── Right Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-7 py-5 border-b border-border bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground">{NAV_ITEMS.find(n => n.id === activeTab)!.label}</h1>
            <p className="text-[11px] text-muted mt-0.5">{NAV_ITEMS.find(n => n.id === activeTab)!.description}</p>
          </div>
          {activeTab === "campaigns" && (
            <span className="text-[10px] font-bold text-muted bg-border/40 px-3 py-1 rounded-full">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.16 }} className="space-y-5">

              {/* ── Campaigns Tab ── */}
              {activeTab === "campaigns" && (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto border border-border/60 rounded-2xl bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAFFAF]/25 border-b border-border/60 text-muted font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-4">Campaign Name</th>
                          <th className="p-4 hidden md:table-cell">Template</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Delivery Stats</th>
                          <th className="p-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {campaigns.map((c) => (
                          <tr key={c.id} className="hover:bg-[#FAFBFA]/50 transition-colors">
                            <td className="p-4 font-bold text-foreground">
                              <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary shrink-0" />{c.name}</div>
                            </td>
                            <td className="p-4 text-muted font-mono text-[10px] hidden md:table-cell">{c.templateName}</td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                            </td>
                            <td className="p-4 text-muted font-medium">
                              <div className="flex items-center gap-3 text-xs">
                                <span><strong className="text-foreground">{c.sentCount}</strong> Sent</span>
                                {c.sentCount > 0 && <><span><strong className="text-foreground">{Math.round((c.readCount / c.sentCount) * 100)}%</strong> Read</span><span><strong className="text-foreground">{Math.round((c.repliedCount / c.sentCount) * 100)}%</strong> Replied</span></>}
                              </div>
                            </td>
                            <td className="p-4 text-muted font-medium text-[10px]">
                              {new Date(c.sentAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="flex flex-col gap-3 sm:hidden">
                    {campaigns.map((c) => (
                      <div key={c.id} className="border border-border/60 rounded-2xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary shrink-0" /><p className="font-bold text-sm text-foreground">{c.name}</p></div>
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span><strong className="text-foreground">{c.sentCount}</strong> Sent</span>
                          {c.sentCount > 0 && <><span><strong className="text-foreground">{Math.round((c.readCount / c.sentCount) * 100)}%</strong> Read</span><span><strong className="text-foreground">{Math.round((c.repliedCount / c.sentCount) * 100)}%</strong> Replied</span></>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Analytics Tab ── */}
              {activeTab === "analytics" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Avg Delivery Rate", value: "99.2%",                   note: "Exceeds Meta benchmarks", color: "text-green-600" },
                      { label: "Avg Read Rate",     value: totalSent > 0 ? `${Math.round((totalRead / totalSent) * 100)}%` : "—", note: "Healthy user interaction", color: "text-green-600" },
                      { label: "Avg Reply Rate",    value: totalSent > 0 ? `${Math.round((totalReplied / totalSent) * 100)}%` : "—", note: "High lead conversions",   color: "text-green-600" },
                    ].map((s) => (
                      <div key={s.label} className="p-5 border border-border/80 rounded-2xl bg-[#FAFBFA] space-y-2">
                        <span className="text-[10px] font-bold text-muted uppercase">{s.label}</span>
                        <h3 className="text-3xl font-extrabold text-foreground">{s.value}</h3>
                        <span className={`text-[10px] font-semibold ${s.color}`}>{s.note}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-border bg-[#FAFBFA] p-6 text-center space-y-2">
                    <BarChart3 className="h-10 w-10 text-muted/30 mx-auto" />
                    <p className="text-sm font-bold text-foreground">Detailed analytics coming soon</p>
                    <p className="text-xs text-muted">Charts for open rates, click-through, and reply trends will appear here.</p>
                  </div>
                </div>
              )}

              {/* ── Archived Tab ── */}
              {activeTab === "archived" && (
                <div className="rounded-2xl border border-dashed border-border bg-[#FAFBFA] py-16 flex flex-col items-center gap-3 text-center">
                  <Archive className="h-10 w-10 text-muted/30" />
                  <p className="text-sm font-bold text-foreground">No archived broadcasts</p>
                  <p className="text-xs text-muted">Completed campaigns older than 90 days are automatically archived here.</p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Create Broadcast Dialog */}
      <Dialog open={wizardOpen} onClose={() => { setWizardOpen(false); setStep(1); }} title="Create WhatsApp Broadcast" size="md">
        <form onSubmit={triggerBroadcast} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2].map((n) => (
              <div key={n} className={`flex items-center gap-1.5 text-xs font-bold ${step === n ? "text-foreground" : "text-muted"}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === n ? "bg-foreground text-white" : step > n ? "bg-green-500 text-white" : "bg-border text-muted"}`}>{n}</div>
                {n === 1 ? "Campaign" : "Audience"}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Broadcast Name</label>
                <Input placeholder="e.g. June newsletter promo" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Select Meta Approved Template</label>
                <select value={formData.template} onChange={(e) => setFormData((f) => ({ ...f, template: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus" required>
                  <option value="">— Choose Approved Template —</option>
                  <option value="summer_sale_2026">summer_sale_2026 (Marketing)</option>
                  <option value="lead_followup_v2">lead_followup_v2 (Utility)</option>
                  <option value="service_update">service_update (Utility)</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setWizardOpen(false)}>Cancel</Button>
                <Button type="button" onClick={() => setStep(2)} disabled={!formData.name || !formData.template} className="flex items-center gap-1">Next Step <ChevronRight className="h-3 w-3" /></Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Target Contacts Audience</label>
                <select value={formData.audience} onChange={(e) => setFormData((f) => ({ ...f, audience: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus">
                  <option value="all">All Contacts (24 Recipients)</option>
                  <option value="customers">Only Tagged &apos;Customer&apos; (12 Recipients)</option>
                  <option value="leads">Only Tagged &apos;Leads&apos; (10 Recipients)</option>
                </select>
              </div>
              <div className="p-3.5 bg-[#FAFBFA] border rounded-2xl text-xs space-y-1 text-muted">
                <p className="font-bold text-foreground">Verify template layout:</p>
                <p>Header: none</p>
                <p>Body: &quot;Hello, thank you for your interest! Reply with your inquiry here.&quot;</p>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" disabled={sending} className="flex items-center gap-2">
                  {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}<Send className="h-3.5 w-3.5" /> Dispatch
                </Button>
              </div>
            </div>
          )}
        </form>
      </Dialog>
    </div>
  );
}
