"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Users2,
  DollarSign,
  CheckSquare,
  Building2,
  BarChart3,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  BookOpen,
  HelpCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CapabilityItem = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type ChannelItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type MegaMenuConfig = {
  capabilities: CapabilityItem[];
  channels: ChannelItem[];
};

const PLATFORM_MENU: MegaMenuConfig = {
  capabilities: [
    {
      label: "Leads & pipeline",
      description: "Capture, qualify, and move prospects through every stage of your funnel.",
      href: "/dashboard/leads",
      icon: Users2,
    },
    {
      label: "Deals & revenue",
      description: "Track pipeline value, stages, and forecast closings with clarity.",
      href: "/dashboard/deals",
      icon: DollarSign,
    },
    {
      label: "Tasks & activity",
      description: "Never miss a follow-up with assignments, priorities, and due dates.",
      href: "/dashboard/tasks",
      icon: CheckSquare,
    },
    {
      label: "Team workspace",
      description: "Organizations, roles, and shared CRM data for your whole team.",
      href: "/dashboard/organization",
      icon: Building2,
    },
  ],
  channels: [
    { label: "Overview", href: "/dashboard", icon: BarChart3 },
    { label: "Email", href: "#platform", icon: Mail },
    { label: "SMS", href: "#platform", icon: Phone },
    { label: "WhatsApp", href: "#platform", icon: MessageSquare },
    { label: "Web", href: "#platform", icon: Globe },
  ],
};

const SOLUTIONS_MENU: MegaMenuConfig = {
  capabilities: [
    {
      label: "Startups",
      description: "Lightweight CRM to grow from first lead to first deal.",
      href: "#solutions",
      icon: Users2,
    },
    {
      label: "Sales teams",
      description: "Pipeline visibility and task discipline for closers.",
      href: "#solutions",
      icon: DollarSign,
    },
    {
      label: "Agencies",
      description: "Multi-client workspaces with organization-level isolation.",
      href: "#solutions",
      icon: Building2,
    },
  ],
  channels: [
    { label: "SaaS", href: "#solutions", icon: BarChart3 },
    { label: "E-commerce", href: "#solutions", icon: Globe },
    { label: "Services", href: "#solutions", icon: CheckSquare },
  ],
};

const RESOURCES_MENU: MegaMenuConfig = {
  capabilities: [
    {
      label: "Documentation",
      description: "Guides to set up organizations, leads, deals, and tasks.",
      href: "#faq",
      icon: BookOpen,
    },
    {
      label: "Help center",
      description: "Answers to common questions about AuraCRM.",
      href: "#faq",
      icon: HelpCircle,
    },
    {
      label: "Blog",
      description: "Product updates, tips, and revenue workspace ideas.",
      href: "#faq",
      icon: FileText,
    },
  ],
  channels: [
    { label: "FAQ", href: "#faq", icon: HelpCircle },
    { label: "Pricing", href: "#pricing", icon: DollarSign },
    { label: "Contact", href: "#cta", icon: Mail },
  ],
};

export const MEGA_MENUS: Record<string, MegaMenuConfig> = {
  Platform: PLATFORM_MENU,
  Solutions: SOLUTIONS_MENU,
  Resources: RESOURCES_MENU,
};

const panelMotion = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.99,
    transition: { duration: 0.15 },
  },
};

function MegaMenuPanel({ menu }: { menu: MegaMenuConfig }) {
  return (
    <div
      className={cn(
        "bg-white text-foreground",
        "rounded-b-[28px] rounded-tr-[28px]",
        "shadow-[0_24px_64px_rgba(17,17,17,0.12),0_4px_16px_rgba(17,17,17,0.06)]",
        "border border-[rgba(17,17,17,0.06)] border-t-0",
        "min-w-[min(42rem,calc(100vw-3rem))] p-6 md:p-8"
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-10 md:gap-14">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-5">
            Capabilities
          </p>
          <ul className="space-y-1">
            {menu.capabilities.map((item) => (
              <MegaCapabilityLink key={item.label} item={item} />
            ))}
          </ul>
        </div>
        <div className="md:border-l md:border-border md:pl-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-5">
            Channels
          </p>
          <ul className="space-y-0.5">
            {menu.channels.map((item) => (
              <MegaChannelLink key={item.label} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MegaCapabilityLink({ item }: { item: CapabilityItem }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className="group flex gap-4 rounded-2xl p-3 -mx-3 transition-colors duration-200 hover:bg-[#F4F5F1]"
      >
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center text-foreground">
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.35} aria-hidden />
        </span>
        <span className="min-w-0 pt-0.5">
          <span className="block text-base font-semibold text-foreground group-hover:text-foreground">
            {item.label}
          </span>
          <span className="mt-1 block text-sm leading-snug text-muted">{item.description}</span>
        </span>
      </Link>
    </li>
  );
}

function MegaChannelLink({ item }: { item: ChannelItem }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 -mx-3 text-base font-medium text-foreground transition-colors duration-200 hover:bg-[#F4F5F1]"
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-foreground/80" strokeWidth={1.35} aria-hidden />
        {item.label}
      </Link>
    </li>
  );
}

type NavMegaTriggerProps = {
  label: string;
  menu: MegaMenuConfig;
  align?: "left" | "center";
};

export function NavMegaTrigger({ label, menu, align = "left" }: NavMegaTriggerProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const handleEnter = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "relative z-20 inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition-colors duration-200",
          open
            ? "bg-white text-foreground rounded-t-[20px] shadow-[0_-2px_0_rgba(17,17,17,0.04)]"
            : "text-foreground/90 hover:text-foreground rounded-full hover:bg-white/40"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-70 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mega-panel"
            className={cn(
              "absolute top-full z-50 pt-0",
              align === "left" && "left-0",
              align === "center" && "left-1/2 -translate-x-1/2"
            )}
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            {/* Bridge so cursor can move from trigger to panel without closing */}
            <div className="h-2 w-full" aria-hidden />
            <MegaMenuPanel menu={menu} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
