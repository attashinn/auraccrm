"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  position?: "left" | "right";
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  position = "right"
}) => {
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

  const slideVariants = {
    hidden: { x: position === "right" ? "100%" : "-100%" },
    visible: { x: 0 },
    exit: { x: position === "right" ? "100%" : "-100%" }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[rgba(17,17,17,0.35)]"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative w-full max-w-lg h-full bg-surface border-l border-border shadow-2xl z-10 flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
                {description && <p className="text-xs text-muted mt-1">{description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { Drawer };
