"use client";

import Link from "next/link";
import { ImagePlaceholder } from "@/components/landing/image-placeholder";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  illustrationLabel?: string;
};

export function OnboardingShell({
  children,
  step,
  totalSteps,
  illustrationLabel = "Onboarding illustration",
}: OnboardingShellProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Form column */}
        <div className="flex flex-1 flex-col bg-surface min-h-0">
          <header className="px-6 md:px-12 lg:px-16 pt-8 pb-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-primary flex items-center justify-center">
                <span className="text-sm font-black text-foreground">A</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">AuraCRM</span>
            </Link>
          </header>

          <div className="flex-1 flex flex-col px-6 md:px-12 lg:px-16 pb-28 lg:pb-32 max-w-2xl w-full">
            {children}
          </div>
        </div>

        {/* Illustration column */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-[#ECEEE8] border-l border-border p-12 xl:p-16">
          <div className="w-full max-w-md">
            <ImagePlaceholder
              label={illustrationLabel}
              aspect="hero"
              rounded="3xl"
              className="border-[rgba(17,17,17,0.08)] bg-[#E4E6E0]"
            />
          </div>
        </div>
      </div>

      {/* Progress footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-sm border-t border-border px-6 md:px-12 lg:px-16 py-4">
        <div className="flex items-center gap-4 max-w-2xl lg:max-w-none">
          <div className="flex-1 h-1 rounded-full bg-[rgba(17,17,17,0.08)] overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-primary transition-all duration-500 ease-out")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted tabular-nums shrink-0">
            {step}/{totalSteps}
          </span>
        </div>
      </footer>
    </div>
  );
}
