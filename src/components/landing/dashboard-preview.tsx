"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users2, DollarSign, CheckSquare } from "lucide-react";
import { fadeUp } from "@/lib/motion";

const bars = [42, 58, 45, 72, 68, 55, 88, 76, 62, 94, 82, 71];

export function DashboardPreview() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      className="surface-card p-6 md:p-8 w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Portfolio value</p>
              <p className="kpi-value mt-1">$422,525</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/40 px-3 py-1 text-xs font-semibold text-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> +12.4%
            </span>
          </div>

          <div className="flex items-end gap-2 h-36 pt-4">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg transition-colors"
                style={{
                  height: `${h}%`,
                  background: i === bars.length - 1 ? "#C7F464" : "rgba(17,17,17,0.08)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-full lg:w-72 space-y-3">
          <div className="surface-card-accent p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Top pipeline</p>
            <p className="text-xl font-bold mt-1">Acme Corp</p>
            <p className="text-sm text-foreground/80 mt-0.5">$84,200 · Qualified</p>
          </div>

          {[
            { icon: Users2, label: "Active leads", value: "128" },
            { icon: DollarSign, label: "Open deals", value: "34" },
            { icon: CheckSquare, label: "Tasks due", value: "12" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl bg-[#F4F5F1] px-4 py-3 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-surface flex items-center justify-center border border-border">
                  <item.icon className="h-4 w-4 text-foreground" />
                </div>
                <span className="text-sm text-muted">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
