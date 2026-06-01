"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp, BlurIn } from "@/components/motion/primitives";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { cn } from "@/lib/utils";

const LOGO_SLOTS = ["Logo 1", "Logo 2", "Logo 3", "Logo 4", "Logo 5", "Logo 6"];

const CHANNEL_CARDS = [
  { title: "Leads directory", placeholder: "Hero — leads list UI" },
  { title: "Deals pipeline", placeholder: "Hero — kanban pipeline" },
  { title: "Team workspace", placeholder: "Hero — org & members" },
  { title: "Tasks", placeholder: "Hero — task checklist" },
  { title: "Dashboard", placeholder: "Hero — KPI dashboard" },
];

const CASE_STUDIES = [
  { tag: "Success story", title: "Northwind grew pipeline visibility by 40%", placeholder: "Case study — photo 1" },
  { tag: "Success story", title: "Lumen unified sales ops in one workspace", placeholder: "Case study — photo 2" },
  { tag: "Success story", title: "Stackline scaled multi-tenant CRM in weeks", placeholder: "Case study — photo 3" },
];

const PLANS = [
  { name: "Starter", price: "$0", note: "forever", features: ["1 organization", "3 members", "Core CRM"] },
  {
    name: "Growth",
    price: "$49",
    note: "/ seat / mo",
    features: ["Unlimited orgs", "Advanced RBAC", "Priority support"],
    highlight: true,
  },
  { name: "Enterprise", price: "Custom", note: "", features: ["SSO", "Dedicated support", "SLA"] },
];

const FAQS = [
  { q: "Is AuraCRM multi-tenant?", a: "Yes. Every record is scoped to an organization with Clerk auth and Prisma isolation." },
  { q: "Can I invite my team?", a: "Owners and admins invite via Clerk. Roles sync to your database automatically." },
  { q: "Is there a free plan?", a: "Starter is free. Upgrade when you need more seats or advanced controls." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="font-semibold text-foreground pr-4">{q}</span>
        {open ? <Minus className="h-4 w-4 text-muted shrink-0" /> : <Plus className="h-4 w-4 text-muted shrink-0" />}
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} className="overflow-hidden">
        <p className="pb-5 text-sm text-muted leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

function SplitSection({
  id,
  overline,
  title,
  description,
  cta = "Sign up free",
  imageLabel,
  imageFirst = false,
  bullets,
}: {
  id?: string;
  overline: string;
  title: string;
  description: string;
  cta?: string;
  imageLabel: string;
  imageFirst?: boolean;
  bullets?: string[];
}) {
  const text = (
    <div className="flex flex-col justify-center py-8 md:py-16 lg:py-20">
      <p className="landing-overline mb-4">{overline}</p>
      <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-foreground leading-[1.1] max-w-lg">
        {title}
      </h2>
      <p className="mt-5 text-base md:text-lg text-muted leading-relaxed max-w-md">{description}</p>
      {bullets && (
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-foreground hover:gap-3 transition-all w-fit"
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  const visual = (
    <div className="py-8 md:py-12 lg:py-16">
      <ImagePlaceholder label={imageLabel} aspect="wide" rounded="3xl" />
    </div>
  );

  return (
    <section id={id} className="bg-surface">
      <div className="landing-container">
        <div className={cn("grid lg:grid-cols-2 gap-8 lg:gap-16 items-center", imageFirst && "lg:[&>div:first-child]:order-2")}>
          {imageFirst ? (
            <>
              {visual}
              {text}
            </>
          ) : (
            <>
              {text}
              {visual}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const [audienceTab, setAudienceTab] = useState<"small" | "enterprise" | "developers">("small");
  const [agentSlide, setAgentSlide] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* ── Hero (lime + curve) ───────────────────────────── */}
      <section className="landing-hero-curve pt-6 md:pt-10 pb-14 md:pb-20">
        <div className="landing-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <BlurIn className="order-2 lg:order-1">
              <h1 className="text-4xl sm:text-[2.75rem] md:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.08] text-foreground max-w-xl">
                Turn every lead into a lifetime customer.
              </h1>
              <p className="mt-5 text-base md:text-lg text-foreground/80 leading-relaxed max-w-md">
                AuraCRM brings organizations, leads, deals, and tasks into one calm workspace — built for teams who sell with clarity.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/sign-up">
                  <Button size="lg" variant="secondary" className="rounded-full px-8 font-semibold">
                    Sign up free
                  </Button>
                </Link>
              </div>
              <div className="mt-7 flex items-center gap-3 text-sm text-foreground/70">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <span className="font-medium">Loved by growing sales teams</span>
              </div>
            </BlurIn>

            <FadeUp delay={1} className="order-1 lg:order-2">
              <ImagePlaceholder label="Hero — product screenshot collage" aspect="hero" rounded="3xl" />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Logo strip ───────────────────────────────────── */}
      <section className="bg-surface py-14 md:py-20">
        <div className="landing-container text-center">
          <p className="text-sm md:text-base text-muted font-medium max-w-xl mx-auto">
            Join teams around the world who trust AuraCRM for pipeline clarity.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {LOGO_SLOTS.map((name) => (
              <div
                key={name}
                className="h-10 md:h-12 min-w-[100px] px-6 rounded-lg border border-dashed border-border bg-[#F4F5F1] flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-muted"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SplitSection
        id="platform"
        overline="All-in-one solution"
        title="Built to scale with you"
        description="From your first lead to enterprise-grade RBAC — AuraCRM grows with your team without adding complexity."
        imageLabel="Section — product UI collage (left)"
        imageFirst
      />

      <SplitSection
        overline="Multichannel CRM"
        title="Grow your pipeline easily"
        description="Capture prospects, move deals through stages, and keep tasks tied to real opportunities — all in one light, fast interface."
        imageLabel="Section — portrait / mobile mockup"
        bullets={["Leads & contacts in one directory", "Kanban deals pipeline", "Tasks linked to leads or deals"]}
      />

      {/* ── Horizontal feature cards ───────────────────── */}
      <section id="solutions" className="bg-surface py-16 md:py-24 overflow-hidden">
        <div className="landing-container">
          <FadeUp className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Engage your pipeline your way</h2>
          </FadeUp>
        </div>
        <div className="landing-container">
          <div className="landing-scroll-x flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
            {CHANNEL_CARDS.map((card) => (
              <article
                key={card.title}
                className="snap-start shrink-0 w-[280px] md:w-[300px] bg-surface rounded-[28px] border border-border shadow-[var(--shadow-soft)] overflow-hidden"
              >
                <div className="p-5 pb-0">
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                </div>
                <div className="p-4 pt-3">
                  <ImagePlaceholder label={card.placeholder} aspect="square" rounded="2xl" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI / product story (text left, cards right) ───── */}
      <section className="bg-surface py-16 md:py-24">
        <div className="landing-container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-4">Powered by AuraCRM</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                CRM that works with you, and for you
              </h2>
              <p className="mt-5 text-muted leading-relaxed max-w-md">
                Role-based access, Clerk organizations, and Prisma sync — so your data stays secure while your team moves fast.
              </p>
              <div className="mt-8 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAgentSlide((s) => Math.max(0, s - 1))}
                  className="h-11 w-11 rounded-full border border-border bg-surface flex items-center justify-center hover:bg-[#F4F5F1]"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAgentSlide((s) => Math.min(2, s + 1))}
                  className="h-11 w-11 rounded-full bg-foreground text-white flex items-center justify-center"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="landing-scroll-x flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2">
              {["Overview agent", "Pipeline agent", "Team agent"].map((title, i) => (
                <article
                  key={title}
                  className={cn(
                    "snap-start shrink-0 w-[85%] sm:w-[320px] rounded-[28px] border border-border bg-surface overflow-hidden transition-opacity",
                    agentSlide === i ? "opacity-100" : "opacity-40"
                  )}
                >
                  <ImagePlaceholder label={`Card — ${title} illustration`} aspect="video" rounded="2xl" className="rounded-b-none border-0 border-b border-dashed" />
                  <div className="p-6">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed">
                      Placeholder copy for feature card. Replace with your messaging.
                    </p>
                    <Button
                      variant={i === agentSlide ? "secondary" : "outline"}
                      size="sm"
                      className="mt-5 rounded-full"
                    >
                      Learn more
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience tabs ──────────────────────────────── */}
      <section className="bg-surface py-16 md:py-24">
        <div className="landing-container">
          <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight max-w-3xl mx-auto">
            Built for every business — from the first lead to enterprise
          </h2>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex p-1 rounded-full bg-[#ECEEE8] border border-border">
              {(
                [
                  { key: "small" as const, label: "Small Business" },
                  { key: "enterprise" as const, label: "Enterprise" },
                  { key: "developers" as const, label: "Developers" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAudienceTab(tab.key)}
                  className={cn(
                    "px-5 md:px-8 py-2.5 rounded-full text-sm font-semibold transition-all",
                    audienceTab === tab.key ? "bg-primary text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-14 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="py-4">
              <p className="landing-overline mb-4">
                {audienceTab === "small" ? "For small teams" : audienceTab === "enterprise" ? "For enterprise" : "For builders"}
              </p>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Powerful tools, simple setup</h3>
              <p className="mt-4 text-muted leading-relaxed max-w-md">
                {audienceTab === "small" &&
                  "Get started in minutes with organizations, leads, and deals — no heavy configuration."}
                {audienceTab === "enterprise" &&
                  "Multi-tenant isolation, audit-safe RBAC, and Clerk-powered identity for large teams."}
                {audienceTab === "developers" &&
                  "Prisma schema, webhooks, and server actions — extend AuraCRM without fighting the stack."}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-foreground">
                <li>· Secure organization workspaces</li>
                <li>· Real-time pipeline metrics</li>
                <li>· Invite members with roles</li>
              </ul>
              <Link href="/dashboard" className="inline-block mt-8">
                <Button variant="secondary" className="rounded-full px-8">
                  Sign up free
                </Button>
              </Link>
            </div>

            <div className="surface-card p-6 md:p-8 rounded-[28px]">
              <ImagePlaceholder label="Testimonial — customer photo" aspect="video" rounded="2xl" />
              <blockquote className="mt-6 text-lg font-medium leading-relaxed text-foreground">
                &ldquo;AuraCRM replaced three tools for us. The pipeline view alone changed how our reps work.&rdquo;
              </blockquote>
              <p className="mt-4 text-sm font-semibold">Alex Morgan</p>
              <p className="text-sm text-muted">Head of Sales, Placeholder Co.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Awards band ─────────────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="landing-container">
          <div className="landing-band-muted px-6 md:px-12 py-12 md:py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Recognized as a modern CRM platform</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
              {["Award 1", "Award 2", "Award 3", "Award 4"].map((a) => (
                <div
                  key={a}
                  className="h-16 w-28 md:h-20 md:w-32 rounded-xl border border-dashed border-border bg-surface flex items-center justify-center text-[10px] font-bold text-muted uppercase"
                >
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Case studies ───────────────────────────────── */}
      <section className="bg-surface py-16 md:py-24">
        <div className="landing-container">
          <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-12">Real stories, real success</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {CASE_STUDIES.map((story) => (
              <article key={story.title} className="group">
                <div className="relative overflow-hidden rounded-[28px]">
                  <ImagePlaceholder label={story.placeholder} aspect="video" rounded="3xl" className="border-0" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xl font-bold drop-shadow-md">Logo</span>
                  </div>
                </div>
                <span className="inline-block mt-4 px-2.5 py-1 rounded-md bg-primary/50 text-[10px] font-bold uppercase tracking-wide text-foreground">
                  {story.tag}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug group-hover:underline">{story.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ────────────────────────────────────── */}
      <section className="landing-container py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center md:text-left">
          {[
            { v: "99.9%", l: "Uptime SLA" },
            { v: "2.4×", l: "Faster follow-ups" },
            { v: "<50ms", l: "Avg. query time" },
            { v: "10k+", l: "Records per org" },
          ].map((m) => (
            <div key={m.l}>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{m.v}</p>
              <p className="mt-2 text-sm text-muted">{m.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Integrations band ──────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="landing-container">
          <div className="landing-band-lime px-6 md:px-12 py-14 md:py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-xl mx-auto">
              Connect AuraCRM to the tools you already use
            </h2>
            <p className="mt-4 text-foreground/80 max-w-lg mx-auto">
              Clerk, Neon, and your stack — placeholders below until you add partner logos.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {["Clerk", "Neon", "Stripe", "Zapier", "Slack"].map((name) => (
                <div
                  key={name}
                  className="h-12 min-w-[88px] px-5 rounded-xl bg-white/50 border border-black/5 flex items-center justify-center text-xs font-bold text-foreground"
                >
                  {name}
                </div>
              ))}
            </div>
            <a href="#pricing" className="inline-block mt-8 text-sm font-bold underline underline-offset-4">
              See integrations
            </a>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="bg-surface py-16 md:py-24">
        <div className="landing-container">
          <FadeUp className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-muted">Start free. Scale when your pipeline does.</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-[28px] p-8 flex flex-col",
                  plan.highlight ? "bg-primary border border-black/5" : "surface-card"
                )}
              >
                <p className="text-sm font-semibold text-muted">{plan.name}</p>
                <p className="text-4xl font-bold mt-2 tracking-tight">
                  {plan.price}
                  {plan.note && <span className="text-sm font-medium text-muted ml-1">{plan.note}</span>}
                </p>
                <ul className="mt-6 space-y-2 flex-1 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className="mt-8 block">
                  <Button variant={plan.highlight ? "secondary" : "outline"} className="w-full rounded-full">
                    Get started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section id="faq" className="landing-container py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight mb-10">FAQ</h2>
        <div className="max-w-2xl mx-auto surface-card px-7">
          {FAQS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── Final CTA band ─────────────────────────────── */}
      <section className="py-10 md:py-14 pb-0">
        <div className="landing-container">
          <div className="landing-band-lime px-6 md:px-12 py-14 md:py-20 text-center">
            <p className="text-sm text-foreground/80 max-w-lg mx-auto">
              Connect with customers, leads, and deals on a single platform with AuraCRM.
            </p>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">Ready to grow with clarity?</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard">
                <Button variant="secondary" size="lg" className="rounded-full px-8 font-semibold">
                  Sign up free
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="rounded-full px-8 font-semibold bg-white/40 border-black/20">
                  Get a demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-foreground/60">No credit card required</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
