import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={twMerge(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_2px_12px_rgba(199,244,100,0.45)] border border-[rgba(17,17,17,0.08)]",
          variant === "secondary" &&
            "bg-foreground text-white hover:bg-[#2a2a2a] border border-transparent",
          variant === "outline" &&
            "bg-surface text-foreground border border-border hover:bg-surface-muted",
          variant === "ghost" &&
            "text-muted hover:text-foreground hover:bg-[rgba(17,17,17,0.04)] border border-transparent",
          variant === "danger" &&
            "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
          size === "sm" && "h-9 px-4 text-xs",
          size === "md" && "h-11 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          size === "icon" && "h-10 w-10 p-0 rounded-full",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
