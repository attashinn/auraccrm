"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  getTasksAction,
  getOrgMembersAction,
  createTaskAction,
  updateTaskAction,
  toggleTaskStatusAction,
  deleteTaskAction,
} from "@/actions/tasks";
import { getLeadsAction } from "@/actions/leads";
import { getDealsAction } from "@/actions/deals";
import { TaskStatus, TaskPriority } from "@/lib/validations/tasks";
import {
  Plus, Search, Loader2, AlertCircle, Trash2, Pencil, X,
  Calendar, Link as LinkIcon, ListTodo, CheckCircle2, Clock,
  Flag, UserCircle2, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AssignedTo {
  membershipId: string;
  role: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  leadId: string | null;
  dealId: string | null;
  assignedToMembershipId: string | null;
  createdAt: string;
  lead?: { id: string; firstName: string; lastName: string | null; company: string | null } | null;
  deal?: { id: string; name: string } | null;
  assignedTo?: {
    id: string;
    role: string;
    user: { id: string; firstName: string | null; lastName: string | null; email: string };
  } | null;
}

interface LeadOption { id: string; firstName: string; lastName: string | null; company: string | null; }
interface DealOption { id: string; name: string; }

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badgeVariant: "danger" | "warning" | "info" }> = {
  HIGH:   { label: "High",   badgeVariant: "danger" },
  MEDIUM: { label: "Medium", badgeVariant: "warning" },
  LOW:    { label: "Low",    badgeVariant: "info" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  TODO: { label: "To Do", color: "text-muted", bg: "bg-[#F4F5F1] border-border/80" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
};

const FILTER_TABS = [
  { key: "ALL" as const,         label: "All" },
  { key: "TODO" as const,        label: "To Do" },
  { key: "IN_PROGRESS" as const, label: "In Progress" },
  { key: "COMPLETED" as const,   label: "Completed" },
  { key: "ACTIVE" as const,      label: "Active" },
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

function isOverdue(iso: string | null, status: string) {
  if (!iso || status === "COMPLETED") return false;
  return new Date(iso) < new Date();
}

function getUserInitials(first: string | null, last: string | null) {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [members, setMembers] = useState<AssignedTo[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [dealOptions, setDealOptions] = useState<DealOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | TaskStatus | "ACTIVE">("ALL");
  const [, startTransition] = useTransition();

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", status: "TODO" as TaskStatus,
    priority: "MEDIUM" as TaskPriority, dueDate: "",
    assignedToMembershipId: "", leadId: "", dealId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────
  const loadTasks = useCallback(async (searchVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTasksAction({ search: searchVal });
      if (result.success && result.data) setTasks(result.data as TaskRecord[]);
      else setError(result.error || "Failed to load tasks.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load tasks."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
      getOrgMembersAction().then((r) => r.success && r.data && setMembers(r.data as AssignedTo[]));
      getLeadsAction().then((r) => r.success && r.data && setLeads(r.data as LeadOption[]));
      getDealsAction().then((r) => r.success && r.data && setDealOptions(r.data as DealOption[]));
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  useEffect(() => {
    const t = setTimeout(() => loadTasks(search), 350);
    return () => clearTimeout(t);
  }, [search, loadTasks]);

  // ── Stats ─────────────────────────────────────
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  // ── Filter ───────────────────────────────────
  const filteredTasks = tasks.filter((t) => {
    if (filterTab === "ACTIVE") return t.status === "TODO" || t.status === "IN_PROGRESS";
    if (filterTab === "ALL") return true;
    return t.status === filterTab;
  });

  // ── Form helpers ─────────────────────────────
  const EMPTY_FORM = { title: "", description: "", status: "TODO" as TaskStatus, priority: "MEDIUM" as TaskPriority, dueDate: "", assignedToMembershipId: "", leadId: "", dealId: "" };

  function openCreate() {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(task: TaskRecord) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      assignedToMembershipId: task.assignedToMembershipId || "",
      leadId: task.leadId || "",
      dealId: task.dealId || "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assignedToMembershipId: form.assignedToMembershipId || null,
      leadId: form.leadId || null,
      dealId: form.dealId || null,
    };
    try {
      const result = editingTask
        ? await updateTaskAction(editingTask.id, payload)
        : await createTaskAction(payload);
      if (!result.success) throw new Error(result.error);
      setModalOpen(false);
      await loadTasks(search);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task: TaskRecord) {
    setTogglingId(task.id);
    const cycleNext: Record<TaskStatus, TaskStatus> = { TODO: "IN_PROGRESS", IN_PROGRESS: "COMPLETED", COMPLETED: "TODO" };
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: cycleNext[t.status] } : t));
    try {
      const result = await toggleTaskStatusAction(task.id);
      if (!result.success) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
        alert(result.error || "Failed to update.");
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteTaskAction(id);
      if (result.success) setTasks((prev) => prev.filter((t) => t.id !== id));
      else alert(result.error || "Failed to delete task.");
    });
  }

  const tabCount = (key: string) => {
    if (key === "ACTIVE") return todoCount + inProgressCount;
    if (key === "TODO") return todoCount;
    if (key === "IN_PROGRESS") return inProgressCount;
    if (key === "COMPLETED") return completedCount;
    return tasks.length;
  };

  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6 flex flex-col h-full bg-white p-6 md:p-8 rounded-3xl border border-border shadow-[0_4px_24px_rgba(17,17,17,0.02)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Tasks
          </h1>
        </div>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1.5 shrink-0 px-4 py-2 font-bold rounded-xl bg-foreground text-white hover:bg-foreground/90">
          Create task
        </Button>
      </div>

      {/* Brevo-style Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-7 text-base font-semibold flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`pb-3 -mb-[14px] cursor-pointer transition-all ${
                filterTab === tab.key
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              {tab.label} <span className="text-xs ml-1 text-muted/65 font-bold">({tabCount(tab.key)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-52 xl:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Search a task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-sm rounded-full border-border/80"
            />
          </div>
          <span className="text-xs text-muted font-bold px-3 py-1.5 rounded-full bg-border/40 select-none">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer">
          <Settings2 className="h-4 w-4" /> Customise columns
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => loadTasks()} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Task Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 flex-1">
          <div className="flex flex-col items-center gap-3 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <span className="text-xs font-medium">Loading tasks...</span>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Brevo exact empty state */
        <div className="text-center py-20 flex flex-col items-center justify-center gap-4 flex-1 select-none">
          {/* Custom Brevo Illustration SVG */}
          <div className="h-32 w-48 opacity-90 mb-2 flex items-center justify-center">
            <svg viewBox="0 0 120 80" className="h-full w-full" fill="none">
              <path d="M10 70h100M20 70c5-15 15-25 30-25s15 10 20 25M70 70c3-10 8-15 15-15s10 5 15 15" stroke="#eceee8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="30" r="10" fill="#c7f464" opacity="0.65" />
              <path d="M40 38c5-1 10-1 15 0" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="85" cy="50" r="6" fill="#eceee8" />
              <path d="M47 30h6M50 27v6" stroke="#111111" strokeWidth="1" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-foreground tracking-tight">You don&apos;t have any tasks yet</h3>
          <p className="text-xs text-muted max-w-[280px] leading-relaxed">
            Add new tasks to stay on top of your deals.
          </p>
          <button
            onClick={openCreate}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Create task
          </button>
        </div>
      ) : (
        /* Task List */
        <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[62vh] select-none">
          {filteredTasks.map((task) => {
            const p = PRIORITY_CONFIG[task.priority];
            const s = STATUS_CONFIG[task.status];
            const overdue = isOverdue(task.dueDate, task.status);
            const isToggling = togglingId === task.id;
            const assignee = task.assignedTo?.user;

            return (
              <div key={task.id}
                className={`py-6 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 transition-all duration-200 group ${task.status === "COMPLETED" ? "opacity-55 hover:opacity-75" : ""}`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Status Checkbox toggle */}
                  <button
                    onClick={() => handleToggle(task)}
                    disabled={isToggling}
                    className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50 ${
                      task.status === "COMPLETED" ? "bg-emerald-500/20 border-emerald-500" :
                      task.status === "IN_PROGRESS" ? "bg-blue-500/10 border-blue-400 hover:border-blue-300" :
                      "bg-[#F4F5F1] border-border hover:border-border"
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-muted" />
                    ) : task.status === "COMPLETED" ? (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : task.status === "IN_PROGRESS" ? (
                      <div className="h-2 w-2 rounded-full bg-blue-450" />
                    ) : null}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <p className={`text-base font-bold leading-normal flex-1 transition-all ${task.status === "COMPLETED" ? "line-through text-muted" : "text-foreground"}`}>
                        {task.title}
                      </p>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted leading-relaxed line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      {/* Status pill */}
                      <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span className={`text-sm flex items-center gap-1.5 font-medium ${overdue ? "text-red-600" : "text-muted"}`}>
                          <Calendar className="h-4 w-4 shrink-0 text-muted/60" />
                          {overdue && <span className="font-bold">Overdue · </span>}
                          {formatDate(task.dueDate)}
                        </span>
                      )}

                      {/* Linked Lead */}
                      {task.lead && (
                        <span className="text-sm text-foreground/80 flex items-center gap-1.5 font-medium">
                          <LinkIcon className="h-4 w-4 shrink-0 text-muted/50" />
                          {task.lead.firstName} {task.lead.lastName || ""}
                        </span>
                      )}

                      {/* Linked Deal */}
                      {task.deal && (
                        <span className="text-sm text-amber-500/80 flex items-center gap-1.5 font-medium">
                          <LinkIcon className="h-4 w-4 shrink-0 text-amber-400/65" />
                          {task.deal.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-10 sm:pl-0 shrink-0">
                  <div className="flex items-center gap-2">
                    {assignee && (
                      <div
                        title={`${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email}
                        className="h-8 w-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0"
                      >
                        <span className="text-xs font-bold text-violet-700">
                          {getUserInitials(assignee.firstName, assignee.lastName)}
                        </span>
                      </div>
                    )}

                    <Badge variant={p.badgeVariant} className="px-3 py-1 font-bold text-xs tracking-wider uppercase">{p.label}</Badge>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(task)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-lg border border-border bg-[#F4F5F1] hover:bg-primary/20 hover:border-border transition-colors cursor-pointer">
                      <Pencil className="h-3 w-3 text-muted hover:text-foreground" />
                    </button>
                    <button onClick={() => handleDelete(task.id)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-lg border border-border bg-[#F4F5F1] hover:bg-red-50 hover:border-red-500/20 transition-colors cursor-pointer">
                      <Trash2 className="h-3 w-3 text-muted hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ─── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingTask ? "Edit Task" : "Create New Task"}
        description={editingTask ? "Update task details, assignee, and linked records." : "Add a new actionable task to your planner."}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Task Title *</label>
            <Input type="text" placeholder="e.g. Follow up with Elena on proposal" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Description</label>
            <textarea rows={2} placeholder="Additional context..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none input-focus resize-none"
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date + Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Due Date</label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase">Assign To</label>
              <select value={form.assignedToMembershipId}
                onChange={(e) => setForm((f) => ({ ...f, assignedToMembershipId: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
              >
                <option value="">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.membershipId} value={m.membershipId}>
                    {m.firstName} {m.lastName} ({m.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Link Lead */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Link to Lead (Optional)</label>
            <select value={form.leadId} onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
            >
              <option value="">— No lead —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.firstName} {l.lastName || ""}{l.company ? ` (${l.company})` : ""}</option>
              ))}
            </select>
          </div>

          {/* Link Deal */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Link to Deal (Optional)</label>
            <select value={form.dealId} onChange={(e) => setForm((f) => ({ ...f, dealId: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
            >
              <option value="">— No deal —</option>
              {dealOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
