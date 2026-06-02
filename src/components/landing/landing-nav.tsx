"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavMegaTrigger, MEGA_MENUS } from "@/components/landing/nav-mega-menu";
import { motion, AnimatePresence } from "framer-motion";

const MEGA_LABELS = ["Platform", "Solutions", "Resources"] as const;

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="landing-nav sticky top-0 z-50">
      <div className="landing-container flex h-16 md:h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold tracking-tight text-foreground shrink-0"
        >
          AuraCRM
        </Link>

        <nav className="hidden lg:flex items-end gap-0.5 h-full pb-0 relative">
          {MEGA_LABELS.map((label) => (
            <NavMegaTrigger key={label} label={label} menu={MEGA_MENUS[label]} />
          ))}
          <a
            href="#pricing"
            className="inline-flex items-center px-4 py-2.5 mb-0 text-sm font-medium text-foreground/90 hover:text-foreground rounded-full hover:bg-white/40 transition-colors duration-200"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            type="button"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/40 transition-colors"
            aria-label="Language"
          >
            <Globe className="h-4 w-4" />
          </button>
          <Link href="/sign-in" className="hidden sm:inline text-sm font-semibold px-3 py-2 hover:opacity-80">
            Log in
          </Link>
          <Link href="/sign-up">
            <Button size="sm" variant="secondary" className="rounded-full px-5 font-semibold">
              Sign up free
            </Button>
          </Link>
          <Link href="/sign-up" className="hidden md:block">
            <Button size="sm" variant="outline" className="rounded-full px-5 font-semibold bg-white/60 border-[rgba(17,17,17,0.1)] hover:bg-white">
              Get a demo
            </Button>
          </Link>
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#c7f464] border-b border-[rgba(17,17,17,0.1)] shadow-xl overflow-hidden z-40"
          >
            <div className="landing-container py-6 flex flex-col gap-4 max-h-[calc(100vh-64px)] overflow-y-auto">
              {MEGA_LABELS.map((label) => (
                <MobileMenuAccordion
                  key={label}
                  label={label}
                  menu={MEGA_MENUS[label]}
                  closeMenu={() => setMobileMenuOpen(false)}
                />
              ))}
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-bold text-foreground border-b border-[rgba(17,17,17,0.06)]"
              >
                Pricing
              </a>
              <div className="flex flex-col gap-3 pt-4">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-bold text-foreground border border-black/10 rounded-full hover:bg-white/10"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-bold bg-foreground text-white rounded-full hover:opacity-90"
                >
                  Sign up free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Collapsible Mobile Menu Accordion Component
function MobileMenuAccordion({
  label,
  menu,
  closeMenu,
}: {
  label: string;
  menu: (typeof MEGA_MENUS)[keyof typeof MEGA_MENUS];
  closeMenu: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[rgba(17,17,17,0.06)] pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-base font-bold text-foreground"
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden pl-3 mt-1 space-y-2 pb-2"
          >
            {menu.capabilities.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="block text-sm font-semibold text-foreground/80 hover:text-foreground py-1"
              >
                {item.label}
              </Link>
            ))}
            {menu.channels.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="block text-sm font-semibold text-foreground/80 hover:text-foreground py-1"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

