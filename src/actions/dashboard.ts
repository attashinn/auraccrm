"use server";

import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth-context";

export interface DashboardMetrics {
  // Leads
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  leadsByStatus: { status: string; count: number }[];

  // Deals
  totalDeals: number;
  totalPipelineValue: number;
  wonValue: number;
  activeDeals: number;
  dealsByStage: { stage: string; count: number; value: number }[];
  winRate: number;

  // Tasks
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;

  // Recent activity
  recentLeads: {
    id: string;
    firstName: string;
    lastName: string | null;
    company: string | null;
    status: string;
    source: string | null;
    value: number;
    createdAt: string;
  }[];
  recentDeals: {
    id: string;
    name: string;
    value: number;
    stage: string;
    createdAt: string;
  }[];
  urgentTasks: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
    lead: { firstName: string; lastName: string | null } | null;
    deal: { name: string } | null;
  }[];
}

export async function getDashboardMetricsAction(): Promise<{ success: true; data: DashboardMetrics } | { success: false; error: string }> {
  try {
    const org = await getActiveOrg();
    const orgId = org.id;

    const now = new Date();

    // ── Run all queries in parallel ───────────────────────────────────────────
    const [
      leads,
      deals,
      tasks,
      recentLeads,
      recentDeals,
      urgentTasks,
    ] = await Promise.all([
      // Lead counts grouped by status
      db.lead.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { id: true },
      }),

      // Deal counts + sums grouped by stage
      db.deal.groupBy({
        by: ["stage"],
        where: { organizationId: orgId },
        _count: { id: true },
        _sum: { value: true },
      }),

      // Task counts grouped by status
      db.task.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { id: true },
      }),

      // 5 most recent leads
      db.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          status: true,
          source: true,
          value: true,
          createdAt: true,
        },
      }),

      // 5 most recent deals
      db.deal.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          createdAt: true,
        },
      }),

      // Urgent/overdue tasks (non-completed, sorted by priority desc)
      db.task.findMany({
        where: {
          organizationId: orgId,
          status: { not: "COMPLETED" },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
          lead: { select: { firstName: true, lastName: true } },
          deal: { select: { name: true } },
        },
      }),
    ]);

    // ── Aggregate leads ───────────────────────────────────────────────────────
    const totalLeads = leads.reduce((sum, l) => sum + l._count.id, 0);
    const newLeads = leads.find((l) => l.status === "NEW")?._count.id ?? 0;
    const qualifiedLeads = leads.find((l) => l.status === "QUALIFIED")?._count.id ?? 0;
    const leadsByStatus = leads.map((l) => ({ status: l.status, count: l._count.id }));

    // ── Aggregate deals ───────────────────────────────────────────────────────
    const totalDeals = deals.reduce((sum, d) => sum + d._count.id, 0);
    const totalPipelineValue = deals.reduce((sum, d) => sum + Number(d._sum.value ?? 0), 0);
    const wonValue = deals.find((d) => d.stage === "WON")?._sum.value ? Number(deals.find((d) => d.stage === "WON")!._sum.value) : 0;
    const activeDeals = deals
      .filter((d) => !["WON", "LOST"].includes(d.stage))
      .reduce((sum, d) => sum + d._count.id, 0);

    const dealsByStage = deals.map((d) => ({
      stage: d.stage,
      count: d._count.id,
      value: Number(d._sum.value ?? 0),
    }));

    const wonCount = deals.find((d) => d.stage === "WON")?._count.id ?? 0;
    const lostCount = deals.find((d) => d.stage === "LOST")?._count.id ?? 0;
    const closedTotal = wonCount + lostCount;
    const winRate = closedTotal > 0 ? Math.round((wonCount / closedTotal) * 100) : 0;

    // ── Aggregate tasks ───────────────────────────────────────────────────────
    const totalTasks = tasks.reduce((sum, t) => sum + t._count.id, 0);
    const pendingTasks = tasks.find((t) => t.status === "TODO")?._count.id ?? 0;
    const inProgressTasks = tasks.find((t) => t.status === "IN_PROGRESS")?._count.id ?? 0;
    const completedTasks = tasks.find((t) => t.status === "COMPLETED")?._count.id ?? 0;

    // Count overdue tasks (dueDate in the past and not completed)
    const overdueTasks = await db.task.count({
      where: {
        organizationId: orgId,
        status: { not: "COMPLETED" },
        dueDate: { lt: now },
      },
    });

    // ── Serialize ─────────────────────────────────────────────────────────────
    return {
      success: true,
      data: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        leadsByStatus,

        totalDeals,
        totalPipelineValue,
        wonValue,
        activeDeals,
        dealsByStage,
        winRate,

        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,

        recentLeads: recentLeads.map((l) => ({
          ...l,
          value: Number(l.value),
          createdAt: l.createdAt.toISOString(),
        })),

        recentDeals: recentDeals.map((d) => ({
          ...d,
          value: Number(d.value),
          createdAt: d.createdAt.toISOString(),
        })),

        urgentTasks: urgentTasks.map((t) => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        })),
      },
    };
  } catch (error: any) {
    console.error("[getDashboardMetricsAction ERROR]:", error);
    return { success: false, error: error.message || "Failed to load dashboard metrics." };
  }
}
