"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface LeadStatusData {
  status: string;
  count: number;
  fill: string;
}
export interface DealStageData {
  stage: string;
  count: number;
  value: number;
  fill: string;
}
export interface PipelinePoint {
  stage: string;
  value: number;
  fill: string;
}

interface Props {
  leadsByStatus: LeadStatusData[];
  dealsByStage: DealStageData[];
  revenuePipeline: PipelinePoint[];
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#FFFFFF",
    borderColor: "rgba(17,17,17,0.08)",
    borderRadius: "12px",
    fontSize: "11px",
    boxShadow: "0 8px 32px rgba(17,17,17,0.08)",
  },
  itemStyle: { color: "#111111" },
  labelStyle: { color: "#777777" },
};

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

function PieLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#111111" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted text-xs">
      <svg className="h-10 w-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-[11px]">No {label} yet</p>
    </div>
  );
}

const chartSkeleton = <div className="h-[240px] bg-[rgba(17,17,17,0.06)] rounded-2xl animate-pulse" />;

export function LeadsStatusChart({ data }: { data: LeadStatusData[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) setMounted(true);
    }, 0);
    return () => { active = false; };
  }, []);
  if (!mounted) return chartSkeleton;

  const total = data.reduce((s, d) => s + d.count, 0);
  const hasData = data.length > 0 && total > 0;

  return (
    <div className="h-[240px]">
      {!hasData ? (
        <EmptyChart label="lead data" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="70%"
              paddingAngle={3}
              labelLine={false}
              label={PieLabel}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(val, name) => [`${val} leads`, String(name ?? "").charAt(0) + String(name ?? "").slice(1).toLowerCase()]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(val) => (
                <span style={{ color: "#777777", fontSize: 10 }}>
                  {val.charAt(0) + val.slice(1).toLowerCase()}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DealsByStageChart({ data }: { data: DealStageData[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) setMounted(true);
    }, 0);
    return () => { active = false; };
  }, []);
  if (!mounted) return chartSkeleton;

  const hasData = data.length > 0 && data.some((d) => d.count > 0);

  return (
    <div className="h-[240px]">
      {!hasData ? (
        <EmptyChart label="deal data" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="stage" stroke="#777777" fontSize={10} tickLine={false} tickFormatter={(v) => v.charAt(0) + v.slice(1).toLowerCase()} />
            <YAxis stroke="#777777" fontSize={10} tickLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(val) => [`${val} deals`, "Count"]} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function RevenuePipelineChart({ data }: { data: PipelinePoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) setMounted(true);
    }, 0);
    return () => { active = false; };
  }, []);
  if (!mounted) return chartSkeleton;

  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  return (
    <div className="h-[240px]">
      {!hasData ? (
        <EmptyChart label="pipeline data" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C7F464" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C7F464" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="stage" stroke="#777777" fontSize={10} tickLine={false} tickFormatter={(v) => v.charAt(0) + v.slice(1).toLowerCase()} />
            <YAxis stroke="#777777" fontSize={10} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(val) => [formatCurrency(Number(val)), "Pipeline Value"]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#111111"
              strokeWidth={2}
              fill="url(#pipelineGrad)"
              dot={{ r: 4, fill: "#C7F464", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#b8e850", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function CrmCharts({ leadsByStatus, dealsByStage, revenuePipeline }: Props) {
  return (
    <>
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 surface-card rounded-[28px] p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Revenue Pipeline</h3>
            <p className="text-[11px] text-muted mt-0.5">Cumulative deal value flowing through each stage.</p>
          </div>
          <RevenuePipelineChart data={revenuePipeline} />
        </div>
        <div className="lg:col-span-2 surface-card rounded-[28px] p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Deals by Stage</h3>
            <p className="text-[11px] text-muted mt-0.5">Deal count distribution across pipeline stages.</p>
          </div>
          <DealsByStageChart data={dealsByStage} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="surface-card rounded-[28px] p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Leads by Status</h3>
            <p className="text-[11px] text-muted mt-0.5">Prospect distribution across qualification stages.</p>
          </div>
          <LeadsStatusChart data={leadsByStatus} />
        </div>

        <div className="surface-card rounded-[28px] p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Stage Breakdown</h3>
            <p className="text-[11px] text-muted mt-0.5">Value and count per pipeline stage.</p>
          </div>
          {dealsByStage.length === 0 || dealsByStage.every((d) => d.count === 0) ? (
            <EmptyChart label="stage data" />
          ) : (
            <div className="space-y-2.5">
              {dealsByStage.map((d) => {
                const total = dealsByStage.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.min(100, Math.round((d.value / total) * 100)) : 0;
                return (
                  <div key={d.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.fill }} />
                        <span className="text-muted capitalize">{d.stage.toLowerCase()}</span>
                        <span className="text-muted text-[10px]">{d.count} deal{d.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-foreground font-bold">{formatCurrency(d.value)}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-[rgba(17,17,17,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: d.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
