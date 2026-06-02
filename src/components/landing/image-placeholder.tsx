import {
  CheckCircle2,
  Circle,
  Mail,
  Phone,
  Plus,
  TrendingUp,
  Sparkles,
  Smartphone,
  CheckSquare,
  BarChart2,
  UserPlus,
  ArrowRight,
  TrendingDown,
  Building,
  Menu,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  label?: string;
  aspect?: "video" | "square" | "portrait" | "wide" | "hero";
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "3xl";
};

const aspectMap = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/10]",
  hero: "aspect-[4/3] min-h-[300px] md:min-h-[420px]",
};

const roundedMap = {
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[24px]",
  "3xl": "rounded-[28px]",
};

export function ImagePlaceholder({
  label = "Image placeholder",
  aspect = "wide",
  className,
  rounded = "3xl",
}: ImagePlaceholderProps) {
  const normLabel = label.toLowerCase();

  // 1. HERO — PRODUCT SCREENSHOT COLLAGE
  if (normLabel.includes("hero — product screenshot collage") || normLabel.includes("hero — product screenshot")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 md:p-6 flex flex-col justify-between",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        {/* Simulated Header */}
        <div className="relative z-10 w-full h-11 bg-white/95 backdrop-blur rounded-2xl border border-border flex items-center justify-between px-4 shadow-[0_4px_20px_rgba(17,17,17,0.02)]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            <div className="h-4 w-px bg-border mx-1" />
            <div className="h-5 w-24 rounded-md bg-[rgba(17,17,17,0.04)] flex items-center px-2 text-[9px] font-bold tracking-tight text-muted">
              auracrm.com/dash
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/80 flex items-center justify-center text-[10px] font-black text-foreground">
              T
            </div>
          </div>
        </div>

        {/* Floating Collage Items */}
        <div className="relative z-10 grid grid-cols-12 gap-4 flex-1 mt-4">
          
          {/* Main KPI Card */}
          <div className="col-span-12 sm:col-span-5 bg-white border border-border rounded-3xl p-5 shadow-soft flex flex-col justify-between h-fit hover:translate-y-[-2px] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Pipeline Revenue</span>
              <div className="h-7 w-7 rounded-lg bg-primary/40 border border-border flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-foreground" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-2xl font-black tracking-tight text-foreground">$148,250</h4>
              <p className="text-[11px] text-muted mt-1">
                <span className="text-emerald-600 font-bold">+18.4%</span> vs last month
              </p>
            </div>
          </div>

          {/* Kanban Deal Card */}
          <div className="col-span-12 sm:col-span-7 bg-white border border-border rounded-3xl p-5 shadow-soft hover:translate-y-[-2px] transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/30 border border-border/10 text-foreground">
                Qualified Stage
              </span>
              <span className="text-[10px] font-semibold text-muted">INV-0914</span>
            </div>
            <h4 className="text-sm font-extrabold text-foreground truncate">Enterprise License Upgrade</h4>
            <p className="text-xs text-muted mt-1">Acme Corporation</p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-black text-foreground">$24,000</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 uppercase">High Priority</span>
              </div>
            </div>
          </div>

          {/* Floating task list */}
          <div className="col-span-12 bg-white/90 backdrop-blur border border-border rounded-3xl p-5 shadow-soft flex flex-col gap-2.5 h-fit">
            <div className="flex items-center justify-between mb-1">
              <h5 className="text-xs font-black text-foreground uppercase tracking-wider">Pipeline Checklist</h5>
              <span className="text-[10px] text-muted">2 of 4 complete</span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted line-through opacity-60">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Draft software license proposal</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted line-through opacity-60">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Review contract terms with legal team</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground font-medium">
              <Circle className="h-4 w-4 text-muted shrink-0" />
              <span>Send proposal document to Acme decision makers</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground font-medium">
              <Circle className="h-4 w-4 text-muted shrink-0" />
              <span>Schedule follow-up demo call with Sarah Jenkins</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 2. SECTION — PRODUCT UI COLLAGE (LEFT)
  if (normLabel.includes("section — product ui collage (left)")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-5 flex flex-col gap-4",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        {/* Contact Details Card */}
        <div className="relative z-10 bg-white border border-border rounded-[24px] p-5 shadow-soft flex flex-col gap-4 hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-[#ECEEE8] border border-border flex items-center justify-center font-bold text-foreground text-sm">
              AM
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-foreground">Alex Morgan</h4>
              <p className="text-[11px] text-muted">Head of Operations, Placeholder Co.</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-border pt-4 text-xs text-muted">
            <div className="flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 text-muted" />
              <span>alex.morgan@placeholder.co</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-3.5 w-3.5 text-muted" />
              <span>+1 (555) 019-2834</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline Card */}
        <div className="relative z-10 bg-white/95 backdrop-blur border border-border rounded-[24px] p-5 shadow-soft flex-1 flex flex-col gap-3">
          <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider">Activity History</h5>
          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            
            <div className="flex gap-4 relative">
              <span className="h-4.5 w-4.5 rounded-full bg-primary flex items-center justify-center border border-border shrink-0 z-10">
                <Plus className="h-2.5 w-2.5 text-foreground" />
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">Created lead record</p>
                <p className="text-[10px] text-muted">2 hours ago</p>
              </div>
            </div>

            <div className="flex gap-4 relative">
              <span className="h-4.5 w-4.5 rounded-full bg-[#ECEEE8] flex items-center justify-center border border-border shrink-0 z-10">
                <Mail className="h-2.5 w-2.5 text-muted" />
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">Sent introduction email</p>
                <p className="text-[10px] text-muted">1 hour ago</p>
              </div>
            </div>

            <div className="flex gap-4 relative">
              <span className="h-4.5 w-4.5 rounded-full bg-foreground flex items-center justify-center border border-border shrink-0 z-10">
                <Sparkles className="h-2.5 w-2.5 text-white animate-pulse" />
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">Scheduled demo presentation</p>
                <p className="text-[10px] text-muted">Just now</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 3. SECTION — PORTRAIT / MOBILE MOCKUP
  if (normLabel.includes("section — portrait / mobile mockup") || normLabel.includes("mobile mockup")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 flex items-center justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        {/* Phone Case Frame */}
        <div className="relative w-[210px] h-[330px] rounded-[36px] border-[6px] border-foreground bg-white shadow-hover flex flex-col justify-between overflow-hidden">
          
          {/* Phone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-foreground rounded-b-xl z-20" />
          
          {/* Screen Content */}
          <div className="flex flex-col flex-1 p-3 pt-6 bg-background justify-between">
            
            {/* App Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-[10px] font-black">A</div>
                <span className="text-xs font-bold text-foreground">AuraCRM</span>
              </div>
              <Menu className="h-4 w-4 text-foreground" />
            </div>

            {/* Mobile Metric */}
            <div className="mt-3 bg-white border border-border rounded-2xl p-3 shadow-soft">
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Deals Closed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-black text-foreground">$48,500</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">+12%</span>
              </div>
            </div>

            {/* Mobile List */}
            <div className="flex-1 mt-3 space-y-2 overflow-hidden">
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Active Pipeline</span>
              
              <div className="bg-white border border-border rounded-xl p-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(17,17,17,0.02)]">
                <div>
                  <h6 className="text-[10px] font-extrabold text-foreground truncate">Olivia Ryhe</h6>
                  <p className="text-[9px] text-muted">Enterprise CRM</p>
                </div>
                <span className="text-[10px] font-bold text-foreground">$15,000</span>
              </div>

              <div className="bg-white border border-border rounded-xl p-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(17,17,17,0.02)]">
                <div>
                  <h6 className="text-[10px] font-extrabold text-foreground truncate">Phoenix Baker</h6>
                  <p className="text-[9px] text-muted">SaaS Upgrade</p>
                </div>
                <span className="text-[10px] font-bold text-foreground">$8,200</span>
              </div>

              <div className="bg-white border border-border rounded-xl p-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(17,17,17,0.02)]">
                <div>
                  <h6 className="text-[10px] font-extrabold text-foreground truncate">Lana Steiner</h6>
                  <p className="text-[9px] text-muted">API Licensing</p>
                </div>
                <span className="text-[10px] font-bold text-foreground">$22,000</span>
              </div>
            </div>

            {/* Bottom Nav Bar */}
            <div className="h-1 w-20 bg-foreground/60 rounded-full mx-auto mt-2" />
          </div>
        </div>
      </div>
    );
  }

  // 4. SOLUTION CARDS — LEADS LIST UI
  if (normLabel.includes("leads list ui") || normLabel.includes("leads list")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 flex flex-col gap-3 justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        <div className="relative z-10 bg-white border border-border rounded-[20px] p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h5 className="text-xs font-bold text-foreground">Leads Directory</h5>
            <span className="text-[9px] text-muted bg-[#F4F5F1] px-2 py-0.5 rounded-full border border-border">3 total</span>
          </div>

          <div className="space-y-2">
            {[
              { name: "Olivia Ryhe", status: "QUALIFIED", value: "$15,000", bg: "bg-emerald-50 border-emerald-100 text-emerald-700" },
              { name: "Phoenix Baker", status: "CONTACTED", value: "$24,000", bg: "bg-amber-50 border-amber-100 text-amber-700" },
              { name: "Lana Steiner", status: "PROPOSAL", value: "$48,000", bg: "bg-blue-50 border-blue-100 text-blue-700" },
            ].map((lead) => (
              <div key={lead.name} className="flex items-center justify-between p-2 rounded-xl bg-[#F4F5F1] border border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-white flex items-center justify-center font-bold text-[9px] border border-border shrink-0">
                    {lead.name.split(" ").map(n => n[0]).join("")}
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[90px] md:max-w-none">{lead.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", lead.bg)}>
                    {lead.status}
                  </span>
                  <span className="font-extrabold text-foreground">{lead.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 5. SOLUTION CARDS — KANBAN PIPELINE
  if (normLabel.includes("kanban pipeline") || normLabel.includes("kanban")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 flex gap-3 items-center justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        <div className="relative z-10 w-full grid grid-cols-2 gap-3">
          {/* Column 1 */}
          <div className="bg-white/80 border border-border rounded-2xl p-2.5 flex flex-col gap-2 shadow-soft">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="text-[9px] font-bold text-muted uppercase">Qualified</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#ECEEE8] rounded border">1</span>
            </div>
            
            <div className="bg-white border border-border rounded-xl p-2.5 shadow-[0_1px_2px_rgba(17,17,17,0.02)]">
              <h6 className="text-[10px] font-bold text-foreground leading-tight">Design System</h6>
              <p className="text-[9px] text-muted mt-0.5">Phoenix Baker</p>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-border/80 pt-1.5">
                <span className="text-[10px] font-black text-foreground">$8,500</span>
                <span className="text-[8px] font-semibold text-muted bg-[#F4F5F1] px-1 rounded border">2d</span>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="bg-white/80 border border-border rounded-2xl p-2.5 flex flex-col gap-2 shadow-soft">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="text-[9px] font-bold text-muted uppercase font-bold">Proposal</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-primary/45 rounded border border-primary/20">1</span>
            </div>

            <div className="bg-white border border-primary/40 rounded-xl p-2.5 shadow-[0_2px_8px_rgba(17,17,17,0.04)]">
              <h6 className="text-[10px] font-bold text-foreground leading-tight">E-Commerce Setup</h6>
              <p className="text-[9px] text-muted mt-0.5">Olivia Ryhe</p>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-border/80 pt-1.5">
                <span className="text-[10px] font-black text-foreground">$32,000</span>
                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. SOLUTION CARDS — TEAM WORKSPACE / ORG & MEMBERS
  if (normLabel.includes("org & members") || normLabel.includes("team workspace")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 flex flex-col gap-3 justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        <div className="relative z-10 bg-white border border-border rounded-[20px] p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h5 className="text-xs font-bold text-foreground">Team Workspace</h5>
            <UserPlus className="h-3.5 w-3.5 text-muted hover:text-foreground cursor-pointer" />
          </div>

          <div className="space-y-2">
            {[
              { name: "Tashin Khan", email: "iamtashinn@gmail.com", role: "Owner", active: true },
              { name: "Sarah Jenkins", email: "sarah.j@example.com", role: "Admin", active: true },
              { name: "Michael Chen", email: "m.chen@example.com", role: "Member", active: false },
            ].map((member) => (
              <div key={member.email} className="flex items-center justify-between p-2 rounded-xl bg-[#F4F5F1] border border-border/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center font-black text-[9px] border border-border shrink-0">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                  <div>
                    <h6 className="font-bold text-foreground leading-none">{member.name}</h6>
                    <p className="text-[9px] text-muted mt-0.5">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted font-bold px-2 py-0.5 rounded bg-white border border-border">
                    {member.role}
                  </span>
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    member.active ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 7. SOLUTION CARDS — TASK CHECKLIST
  if (normLabel.includes("task checklist") || normLabel.includes("tasks")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 flex flex-col gap-3 justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        <div className="relative z-10 bg-white border border-border rounded-[20px] p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h5 className="text-xs font-bold text-foreground">Today's Tasks</h5>
            <span className="text-[9px] font-bold text-muted bg-[#F4F5F1] px-1.5 py-0.5 rounded border">4 active</span>
          </div>

          <div className="space-y-2">
            {[
              { task: "Call Acme Corp to discuss proposal", checked: true, priority: "High", color: "text-red-500 bg-red-50 border-red-100" },
              { task: "Review contract terms with legal", checked: true, priority: "Medium", color: "text-amber-600 bg-amber-50 border-amber-100" },
              { task: "Follow up on invoice INV-0024", checked: false, priority: "High", color: "text-red-500 bg-red-50 border-red-100" },
              { task: "Schedule demo with Northwind team", checked: false, priority: "Low", color: "text-blue-500 bg-blue-50 border-blue-100" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#F4F5F1] border border-border/60 text-xs">
                <div className="flex items-center gap-2.5">
                  {item.checked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted shrink-0" />
                  )}
                  <span className={cn(
                    "text-xs text-foreground truncate max-w-[120px] md:max-w-none",
                    item.checked && "line-through opacity-50"
                  )}>{item.task}</span>
                </div>
                <span className={cn("text-[8px] font-bold px-1.5 py-0.2 rounded border", item.color)}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 8. SOLUTION CARDS — KPI DASHBOARD
  if (normLabel.includes("kpi dashboard") || normLabel.includes("dashboard")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-4 flex flex-col gap-3 justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        <div className="relative z-10 w-full grid grid-cols-2 gap-3">
          
          <div className="bg-white border border-border rounded-2xl p-3 shadow-soft flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Total Sales</span>
            <div className="mt-2">
              <h6 className="text-base font-black text-foreground">$142,300</h6>
              <div className="flex items-center gap-1 text-[9px] text-emerald-600 mt-1 font-bold">
                <TrendingUp className="h-2.5 w-2.5" />
                <span>+12%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-3 shadow-soft flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Win Rate</span>
            <div className="mt-2">
              <h6 className="text-base font-black text-foreground">68%</h6>
              <div className="flex items-center gap-1 text-[9px] text-emerald-600 mt-1 font-bold">
                <TrendingUp className="h-2.5 w-2.5" />
                <span>+4%</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-white border border-border rounded-2xl p-3 shadow-soft flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Active Opportunities</span>
              <h6 className="text-lg font-black text-foreground mt-0.5">15 Deals</h6>
            </div>
            <div className="h-8 w-16 bg-[#ECEEE8] border border-border rounded-lg flex items-center justify-center text-[10px] font-bold text-muted uppercase">
              Chart
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 9. AGENT ILLUSTRATIONS
  if (normLabel.includes("agent illustration")) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border bg-[#ECEEE8] p-5 flex items-center justify-center",
          aspectMap[aspect],
          roundedMap[rounded],
          className
        )}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        
        {/* Abstract illustrative composition */}
        <div className="relative h-24 w-24 bg-white/95 backdrop-blur rounded-[24px] border border-border shadow-soft flex items-center justify-center">
          <div className="absolute inset-2 bg-primary/20 rounded-[18px] border border-dashed border-primary/30 flex items-center justify-center animate-spin [animation-duration:40s]" />
          
          <div className="relative h-12 w-12 bg-foreground rounded-2xl flex items-center justify-center shadow-soft">
            {normLabel.includes("overview agent") && <BarChart2 className="h-5 w-5 text-white" />}
            {normLabel.includes("pipeline agent") && <ShieldCheck className="h-5 w-5 text-white" />}
            {normLabel.includes("team agent") && <Zap className="h-5 w-5 text-white" />}
          </div>
        </div>
      </div>
    );
  }

  // 10. GENERAL FALLBACK OR CASE STUDIES
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-dashed border-[rgba(17,17,17,0.12)] bg-[#ECEEE8]",
        aspectMap[aspect],
        roundedMap[rounded],
        className
      )}
      aria-label={label}
    >
      <div className="grid-bg absolute inset-0 opacity-45 pointer-events-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
        
        {/* Abstract Mockup Card */}
        <div className="w-[85%] bg-white/90 backdrop-blur border border-border rounded-2xl p-4 shadow-soft hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-border/80 mb-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
            </div>
            <span className="text-[8px] font-bold text-muted uppercase tracking-wider">{label.split(" ").slice(0, 2).join(" ")}</span>
          </div>
          
          <div className="space-y-1.5 text-[9px] text-muted text-left">
            <div className="h-2 w-3/4 rounded bg-foreground/5" />
            <div className="h-2 w-1/2 rounded bg-foreground/5" />
            <div className="h-4 w-full rounded-lg bg-primary/20 border border-primary/25 mt-3 flex items-center justify-between px-2 text-[9px] font-black text-foreground">
              <span>View Data Analytics</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
