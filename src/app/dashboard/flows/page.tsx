"use client";

import React, { useState } from "react";
import {
  Plus, Settings, Network, Trash2, GitCommit, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FlowRecord {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  runCount: number;
}

const INITIAL_FLOWS: FlowRecord[] = [
  { id: "1", name: "FAQ Self-Service Menu", description: "Answers common shipping, refund, and location inquiries.", isActive: true, runCount: 312 },
  { id: "2", name: "Lead Qualification Survey", description: "Collects company size, budget, and contact emails.", isActive: true, runCount: 149 },
  { id: "3", name: "Support Ticket Router", description: "Collects issue details and assigns to corresponding agent.", isActive: false, runCount: 42 },
];

export default function FlowsPage() {
  const [flows, setFlows] = useState<FlowRecord[]>(INITIAL_FLOWS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = (id: string) => {
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f)));
    toast.success("Flow status updated");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this flow? This cannot be undone.")) return;
    setFlows((prev) => prev.filter((f) => f.id !== id));
    toast.success("Flow deleted.");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlow.name) return;
    setSubmitting(true);
    setTimeout(() => {
      const created: FlowRecord = {
        id: String(flows.length + 1), name: newFlow.name,
        description: newFlow.description, isActive: true, runCount: 0,
      };
      setFlows([created, ...flows]);
      setCreateOpen(false);
      setNewFlow({ name: "", description: "" });
      setSubmitting(false);
      toast.success("Chatbot Flow created!");
    }, 600);
  };

  return (
    <div className="flex flex-col gap-5 bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-border shadow-[0_4px_24px_rgba(17,17,17,0.02)] min-h-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Conversational Flows</h1>
          <p className="text-xs text-muted font-medium mt-1 hidden sm:block">
            Build stateful interactive chatbots that guide customers through decision trees (button menus, lists, surveys).
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 shrink-0 font-bold rounded-xl bg-foreground text-white hover:bg-foreground/90 text-xs w-fit">
          <Plus className="h-3.5 w-3.5" /> Create Chatbot Flow
        </Button>
      </div>

      {/* Flows Grid */}
      {flows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center">
            <Network className="h-7 w-7 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">No flows yet</p>
            <p className="text-xs text-muted mt-1">Create your first chatbot flow to automate customer conversations.</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Create Flow</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {flows.map((f) => (
            <div key={f.id} className="p-5 sm:p-6 border border-border/80 rounded-3xl bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between gap-4">

              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      <Network className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="text-sm font-extrabold text-foreground leading-tight">{f.name}</h3>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(f.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${f.isActive ? "bg-foreground" : "bg-gray-200"}`}
                    title={f.isActive ? "Deactivate" : "Activate"}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${f.isActive ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                <p className="text-[11px] text-muted leading-relaxed font-medium pl-[42px]">{f.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-xs text-muted font-bold flex items-center gap-1.5">
                  <GitCommit className="h-3.5 w-3.5 text-muted/60" />
                  {f.runCount} active runs
                </span>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-[#F4F5F1]">
                    <Settings className="h-4 w-4 text-muted" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50" onClick={() => handleDelete(f.id)}>
                    <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create Stateful Chatbot Flow" description="Define a new conversational flow for your WhatsApp bot." size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Flow Name</label>
            <Input placeholder="e.g. FAQ Self-Service Menu" value={newFlow.name} onChange={(e) => setNewFlow((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Description</label>
            <textarea
              placeholder="Describe what steps, button choices, or customer data queries this flow resolves..."
              value={newFlow.description}
              onChange={(e) => setNewFlow((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="flex w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none input-focus resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Flow
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
