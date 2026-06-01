"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { getOnboardingStatusAction } from "@/actions/onboarding";
import {
  BarChart3,
  Users2,
  DollarSign,
  CheckSquare,
  Building2,
  Menu,
  X,
  Bell,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clerkLightAppearance } from "@/lib/clerk-appearance";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/motion";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "Leads", href: "/dashboard/leads", icon: Users2 },
  { name: "Deals", href: "/dashboard/deals", icon: DollarSign },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Organization", href: "/dashboard/organization", icon: Building2 },
];

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center">
        <span className="text-base font-black text-foreground">A</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">AuraCRM</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { isLoaded, orgId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      const status = await getOnboardingStatusAction();
      if (cancelled) return;
      if (status.success && status.needsOnboarding) {
        router.replace("/onboarding");
        return;
      }
      setOnboardingChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, orgId, router]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (!isLoaded || !onboardingChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-foreground mb-3" />
        <span className="text-xs font-semibold tracking-wider">Loading workspace…</span>
      </div>
    );
  }

  if (!orgId) {
    return null;
  }

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3.5 px-4 h-12 rounded-2xl text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-foreground text-white"
        : "text-muted hover:text-foreground hover:bg-[rgba(17,17,17,0.04)]"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] border-r border-border bg-surface sticky top-0 h-screen shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Logo />
        </div>

        <div className="p-4 border-b border-border">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={clerkLightAppearance}
          />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className={navLinkClass(active)}>
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-border flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-muted font-medium">Account</span>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[rgba(17,17,17,0.35)] z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-surface border-r border-border z-50 p-5 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <Logo />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/onboarding"
                afterSelectOrganizationUrl="/dashboard"
                appearance={clerkLightAppearance}
              />
              <nav className="flex-1 mt-6 space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}>
                      <div className={navLinkClass(active)}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-4 border-t border-border">
                <UserButton />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Workspace</p>
              <p className="text-base font-semibold text-foreground">Overview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block w-52 xl:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search CRM…"
                className="w-full h-10 rounded-full border border-border bg-[#F4F5F1] pl-10 pr-4 text-sm text-foreground placeholder:text-muted input-focus"
              />
            </div>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
            <div className="hidden sm:block">
              <UserButton />
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial="initial"
          animate="animate"
          variants={pageTransition}
          className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
