"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getDashboardMetricsAction, DashboardMetrics } from "@/actions/dashboard";
import { toggleTaskStatusAction } from "@/actions/tasks";
import {
  Users2, DollarSign, CheckSquare, ArrowRight,
  CheckCircle2, AlertCircle, Loader2, RefreshCw, Plus,
  Clock, BarChart3, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return ""; }
}

function isOverdue(iso: string | null, status: string) {
  if (!iso || status === "COMPLETED") return false;
  return new Date(iso) < new Date();
}

const STAGE_COLORS: Record<string, string> = {
  NEW: "#71717a", CONTACTED: "#60a5fa", QUALIFIED: "#a78bfa",
  PROPOSAL: "#fbbf24", WON: "#34d399", LOST: "#f87171",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "#6366f1", CONTACTED: "#60a5fa", QUALIFIED: "#34d399",
  PROPOSAL: "#fbbf24", WON: "#10b981", LOST: "#ef4444",
};

// ─────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[rgba(17,17,17,0.06)] rounded-2xl ${className}`} />;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const loadMetrics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const result = await getDashboardMetricsAction();
      if (result.success) setMetrics(result.data);
      else setError(result.error || "Failed to load metrics.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadMetrics(), 0);
    return () => clearTimeout(t);
  }, [loadMetrics]);

  async function handleToggleTask(taskId: string) {
    setTogglingTaskId(taskId);
    try {
      await toggleTaskStatusAction(taskId);
      await loadMetrics(true);
    } finally {
      setTogglingTaskId(null);
    }
  }

  // ── Chart data ─────────────────────────────
  const dealStageChart = metrics?.dealsByStage.map((d) => ({
    name: d.stage.charAt(0) + d.stage.slice(1).toLowerCase(),
    value: d.value,
    count: d.count,
    fill: STAGE_COLORS[d.stage] ?? "#6366f1",
  })) ?? [];



  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Workspace Overview
          </h1>
          <p className="text-base text-muted mt-1.5">
            Real-time intelligence across your entire sales pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMetrics(true)}
            disabled={refreshing}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-border bg-surface hover:bg-[#F4F5F1] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/leads">
            <Button size="sm" variant="secondary" className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Lead
            </Button>
          </Link>
          <Link href="/dashboard/deals">
            <Button size="sm" className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" /> Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => loadMetrics()} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              label="Total Leads"
              value={String(metrics?.totalLeads ?? 0)}
              sub={`${metrics?.newLeads ?? 0} new · ${metrics?.qualifiedLeads ?? 0} qualified`}
              icon={Users2}
              iconColor="text-foreground"
              iconBg="bg-primary/40 border-border"
              accent
            />
            <KpiCard
              label="Pipeline Value"
              value={formatCurrency(metrics?.totalPipelineValue ?? 0)}
              sub={`${metrics?.activeDeals ?? 0} active deals`}
              icon={DollarSign}
              iconColor="text-foreground"
              iconBg="bg-[#F4F5F1] border-border"
            />
            <KpiCard
              label="Won Revenue"
              value={formatCurrency(metrics?.wonValue ?? 0)}
              sub={`${metrics?.winRate ?? 0}% win rate`}
              icon={Target}
              iconColor="text-foreground"
              iconBg="bg-emerald-50 border-emerald-100"
              accent
            />
            <KpiCard
              label="Active Tasks"
              value={String((metrics?.pendingTasks ?? 0) + (metrics?.inProgressTasks ?? 0))}
              sub={`${metrics?.overdueTasks ?? 0} overdue`}
              icon={CheckSquare}
              iconColor="text-foreground"
              iconBg="bg-amber-50 border-amber-100"
              alert={(metrics?.overdueTasks ?? 0) > 0}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Pipeline Value by Stage — Area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Deal Pipeline by Stage</CardTitle>
            <CardDescription>Total opportunity value across each pipeline stage.</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            {!mounted || loading ? (
              <Skeleton className="h-full" />
            ) : dealStageChart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted text-xs">
                <BarChart3 className="h-8 w-8" />
                No deal data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealStageChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#777777" fontSize={10} tickLine={false} />
                  <YAxis stroke="#777777" fontSize={10} tickLine={false} tickFormatter={(v) => v >= 1000 ? `$${v / 1000}k` : `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", borderColor: "rgba(17,17,17,0.08)", borderRadius: "12px", boxShadow: "0 8px 32px rgba(17,17,17,0.08)" }}
                    itemStyle={{ color: "#111111", fontSize: 11 }}
                    labelStyle={{ color: "#777777", fontSize: 11 }}
                    formatter={(val: unknown, _: unknown, props: { payload?: { count?: number } }) => [
                      `${formatCurrency(Number(val))} (${props?.payload?.count ?? 0} deals)`,
                      "Value"
                    ]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {dealStageChart.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead Status Breakdown — Bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead Status</CardTitle>
            <CardDescription>Breakdown by pipeline status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6" />)
            ) : metrics?.leadsByStatus.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-muted text-xs">
                <Users2 className="h-8 w-8" />
                No leads yet
              </div>
            ) : (
              metrics?.leadsByStatus.map((l) => {
                const pct = metrics.totalLeads > 0 ? Math.round((l.count / metrics.totalLeads) * 100) : 0;
                return (
                  <div key={l.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted font-medium capitalize">{l.status.toLowerCase()}</span>
                      <span className="text-foreground font-bold">{l.count} <span className="text-muted font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[rgba(17,17,17,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: STATUS_COLORS[l.status] ?? "#6366f1" }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Urgent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Urgent Tasks</CardTitle>
              <CardDescription>Active to-dos sorted by priority.</CardDescription>
            </div>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="text-xs text-foreground hover:text-foreground gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : !metrics?.urgentTasks.length ? (
              <div className="text-center py-8 flex flex-col items-center gap-2 text-muted text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                All caught up — no pending tasks!
              </div>
            ) : (
              metrics.urgentTasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                const isToggling = togglingTaskId === task.id;
                return (
                  <div key={task.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#F4F5F1] border border-border hover:border-border transition-colors group">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      disabled={isToggling}
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        task.status === "IN_PROGRESS" ? "border-blue-400 bg-blue-500/10" : "border-border bg-[#F4F5F1] hover:border-foreground/30"
                      }`}
                    >
                      {isToggling && <Loader2 className="h-2.5 w-2.5 animate-spin text-muted" />}
                      {!isToggling && task.status === "IN_PROGRESS" && <div className="h-2 w-2 rounded-full bg-blue-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-600" : "text-muted"}`}>
                            <Clock className="h-3 w-3" />
                            {overdue && "Overdue · "}
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.lead && (
                          <span className="text-xs text-foreground truncate">
                            {task.lead.firstName} {task.lead.lastName || ""}
                          </span>
                        )}
                        {task.deal && (
                          <span className="text-xs text-amber-400 truncate">{task.deal.name}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "info"}>
                      {task.priority}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest prospects added to your pipeline.</CardDescription>
            </div>
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm" className="text-xs text-foreground hover:text-foreground gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : !metrics?.recentLeads.length ? (
              <div className="text-center py-8 flex flex-col items-center gap-2 text-muted text-xs">
                <Users2 className="h-8 w-8" />
                No leads yet — add your first one!
              </div>
            ) : (
              metrics.recentLeads.map((lead) => (
                <div key={lead.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#F4F5F1] border border-border hover:border-border transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {lead.firstName} {lead.lastName || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {lead.company && <span className="text-xs text-muted truncate">{lead.company}</span>}
                      {lead.source && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-zinc-700 shrink-0" />
                          <span className="text-xs text-foreground">{lead.source}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {lead.value > 0 && (
                      <span className="text-sm font-bold text-foreground">{formatCurrency(lead.value)}</span>
                    )}
                    <LeadStatusBadge status={lead.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      {(metrics?.recentDeals?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Deals</CardTitle>
              <CardDescription>Latest opportunities added to your pipeline.</CardDescription>
            </div>
            <Link href="/dashboard/deals">
              <Button variant="ghost" size="sm" className="text-xs text-foreground hover:text-foreground gap-1">
                Pipeline <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics!.recentDeals.map((deal) => {
                const stageColor = STAGE_COLORS[deal.stage] ?? "#6366f1";
                return (
                  <div key={deal.id} className="p-5 rounded-2xl bg-[#F4F5F1] border border-border hover:shadow-[var(--shadow-soft)] transition-all space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{deal.name}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
                        style={{ color: stageColor, borderColor: `${stageColor}30`, background: `${stageColor}12` }}>
                        {deal.stage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-foreground">{formatCurrency(deal.value)}</span>
                      <span className="text-xs text-muted">{formatDate(deal.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, iconColor, iconBg, accent, alert,
}: {
  label: string; value: string; sub: string;
  icon: React.ComponentType<{ className?: string }>; iconColor: string; iconBg: string;
  accent?: boolean; alert?: boolean;
}) {
  return (
    <Card accent={accent} className="surface-card-hover">
      <CardContent className="p-7">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">{label}</span>
          <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
        <p className="kpi-value">{value}</p>
        <p className={`text-sm mt-2 ${alert ? "text-red-600 font-medium" : "text-muted"}`}>{sub}</p>
      </CardContent>
    </Card>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, "neutral" | "warning" | "success" | "danger" | "info"> = {
    NEW: "neutral", CONTACTED: "warning", QUALIFIED: "success", PROPOSAL: "info", WON: "success", LOST: "danger",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}
