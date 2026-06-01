"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, title, description, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[rgba(17,17,17,0.35)]" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-md surface-card z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-start justify-between p-7 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
            {description && <p className="text-sm text-muted mt-1">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-7">{children}</div>
      </div>
    </div>
  );
};

export { Dialog };
