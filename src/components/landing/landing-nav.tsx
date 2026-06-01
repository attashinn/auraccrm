"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavMegaTrigger, MEGA_MENUS } from "@/components/landing/nav-mega-menu";

const MEGA_LABELS = ["Platform", "Solutions", "Resources"] as const;

export function LandingNav() {
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
        </div>
      </div>
    </header>
  );
}
