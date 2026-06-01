import * as React from "react";
import { twMerge } from "tailwind-merge";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={twMerge(
        "flex h-11 w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted input-focus transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
