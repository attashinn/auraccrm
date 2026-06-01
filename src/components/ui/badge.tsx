import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "info" | "success" | "warning" | "danger" | "neutral" | "primary";
}

const Badge: React.FC<BadgeProps> = ({ className, variant = "neutral", ...props }) => {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        variant === "primary" && "bg-primary/30 text-foreground",
        variant === "info" && "bg-blue-50 text-blue-700",
        variant === "success" && "bg-emerald-50 text-emerald-700",
        variant === "warning" && "bg-amber-50 text-amber-800",
        variant === "danger" && "bg-red-50 text-red-600",
        variant === "neutral" && "bg-[rgba(17,17,17,0.06)] text-muted",
        className
      )}
      {...props}
    />
  );
};

export { Badge };
