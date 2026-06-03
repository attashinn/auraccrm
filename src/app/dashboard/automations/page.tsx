"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Plus,
  Settings,
  MessageSquare,
  GitBranch,
  Tag,
  Clock,
  Trash2,
  ChevronRight,
  AlertCircle,
  Play,
  ArrowRight,
  CheckCircle,
  UserCheck,
  Building,
  Activity,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getAutomationsAction,
  toggleAutomationStatusAction,
  deleteAutomationAction
} from "@/actions/automations";

interface AutomationStep {
  id: string;
  stepType: string;
  stepConfig: any;
  position: number;
}

interface Automation {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: any;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
  steps: AutomationStep[];
}

const TEMPLATES = [
  {
    key: "welcome",
    name: "Welcome Message",
    description: "Greet first-time contacts automatically.",
    icon: MessageSquare,
    color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
    badge: "First Message"
  },
  {
    key: "ooo",
    name: "Out of Office",
    description: "Auto-reply when customers text outside work hours.",
    icon: Clock,
    color: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    badge: "New Message"
  },
  {
    key: "qualifier",
    name: "Lead Qualifier",
    description: "Scan inbound texts for matching keywords and qualify.",
    icon: Tag,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    badge: "Keyword Match"
  },
  {
    key: "followup",
    name: "Support Router",
    description: "Tag and assign support chats dynamically.",
    icon: UserCheck,
    color: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
    badge: "Keyword Match"
  }
];

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAutomations = async () => {
    setLoading(true);
    const res = await getAutomationsAction();
    if (res.success && res.data) {
      setAutomations(res.data as any[]);
    } else {
      toast.error(res.error || "Failed to load automations");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    const newStatus = !currentStatus;
    const res = await toggleAutomationStatusAction(id, newStatus);
    if (res.success) {
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: newStatus } : a))
      );
      toast.success(newStatus ? "Workflow activated successfully" : "Workflow paused");
    } else {
      toast.error(res.error || "Failed to toggle status");
    }
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;

    const res = await deleteAutomationAction(id);
    if (res.success) {
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success("Automation deleted successfully");
    } else {
      toast.error(res.error || "Failed to delete automation");
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "keyword_match":
        return "Keyword Match";
      case "first_message":
        return "First Message from Contact";
      case "new_message":
        return "New Message Received";
      case "new_contact":
        return "New Contact Created";
      case "conversation_assigned":
        return "Conversation Assigned";
      case "tag_added":
        return "Tag Added";
      case "time_based":
        return "Time-Based Scheduler";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-full bg-white p-6 md:p-8 rounded-3xl border border-border shadow-[0_4px_24px_rgba(17,17,17,0.02)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
              <Workflow className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Automations
            </h1>
          </div>
          <p className="text-sm text-muted font-medium">
            Build workflows that react to WhatsApp® events and perform CRM actions automatically.
          </p>
        </div>
        
        <Link href="/dashboard/automations/new">
          <Button
            size="sm"
            className="flex items-center gap-1.5 shrink-0 px-4 py-2.5 font-bold rounded-xl bg-foreground text-white hover:bg-foreground/90 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Automation
          </Button>
        </Link>
      </div>

      {/* Templates Row */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-muted uppercase tracking-wider">Quick-start templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <Link 
                key={tmpl.key} 
                href={`/dashboard/automations/new?template=${tmpl.key}`}
                className="group border border-border/80 rounded-2xl p-5 bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-border transition-all flex flex-col justify-between gap-4 cursor-pointer text-left"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${tmpl.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] font-bold text-muted bg-[#F4F5F6] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {tmpl.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-foreground group-hover:text-violet-600 transition-colors">
                    {tmpl.name}
                  </h4>
                  <p className="text-[11px] text-muted leading-relaxed font-medium">
                    {tmpl.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-violet-600 group-hover:gap-1.5 transition-all">
                  Use Template <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Automations Listing */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <h3 className="text-xs font-extrabold text-muted uppercase tracking-wider">Active Workflows</h3>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <span className="text-xs text-muted font-medium">Loading workflows...</span>
            </div>
          </div>
        ) : automations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-3xl p-12 text-center bg-gray-50/20">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-muted/60" />
            </div>
            <h3 className="text-sm font-extrabold text-foreground mb-1">No automations created yet</h3>
            <p className="text-xs text-muted max-w-xs leading-relaxed mb-5">
              Create a custom workflow from scratch or click one of our quick-start templates above to get started.
            </p>
            <Link href="/dashboard/automations/new">
              <Button size="sm" className="rounded-xl font-bold bg-foreground text-white hover:bg-foreground/90">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Start building
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-1">
            {automations.map((w) => {
              const lastExecuted = w.lastExecutedAt 
                ? new Date(w.lastExecutedAt).toLocaleDateString() + " " + new Date(w.lastExecutedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Never executed";

              return (
                <div 
                  key={w.id} 
                  className="p-5 border border-border/80 rounded-2xl bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-lg">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${
                        w.isActive 
                          ? "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20" 
                          : "bg-gray-50 text-gray-400 border-gray-100"
                      }`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                          {w.name}
                          <span className="text-[9px] font-extrabold bg-[#E2E8F0] text-foreground px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {getTriggerLabel(w.triggerType)}
                          </span>
                        </h4>
                        {w.description && (
                          <p className="text-[11px] text-muted font-medium mt-0.5">{w.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-muted font-semibold">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-muted/60" /> {w.steps.length} Steps
                      </span>
                      <span>•</span>
                      <span>Last run: {lastExecuted}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-foreground">{w.executionCount}</div>
                      <div className="text-[10px] text-muted font-bold uppercase">Runs</div>
                    </div>

                    {/* Active/Paused Switch */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted font-black uppercase tracking-wider">
                        {w.isActive ? "Active" : "Paused"}
                      </span>
                      <button
                        onClick={() => handleToggleActive(w.id, w.isActive)}
                        disabled={togglingId === w.id}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          w.isActive ? "bg-violet-600" : "bg-gray-200"
                        } ${togglingId === w.id ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            w.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <Link href={`/dashboard/automations/${w.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(w.id)}
                        className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
