"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "glass" | "glass-secondary" | "premium" | "subtle";
  size?: "sm" | "md" | "lg" | "xl";
  withMotion?: boolean;
  loading?: boolean;
};

type MotionButtonProps = HTMLMotionProps<"button"> & {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "glass" | "glass-secondary" | "premium" | "subtle";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    y: -1,
    transition: {
      type: "spring" as const,
      damping: 20,
      stiffness: 300
    }
  },
  tap: { 
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1
    }
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", withMotion = true, ...props }, ref) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 disabled:opacity-50 disabled:pointer-events-none transform active:scale-95",
      // Primary button with modern gradient
      variant === "default" && "btn-primary px-6 py-2.5",
      // Destructive with modern styling
      variant === "destructive" && "bg-[var(--accent-danger)] text-white border border-white/20 shadow-lg hover:shadow-xl hover:shadow-[var(--accent-danger)]/25 hover:scale-105 active:scale-95",
      // Outline with subtle styling
      variant === "outline" && "btn-secondary",
      // Ghost with subtle hover
      variant === "ghost" && "hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]",
      // Glass effect button
      variant === "glass" && "glass-card px-4 py-2 hover:bg-[var(--surface-hover)] text-[var(--text-primary)]",
      // Secondary glass button
      variant === "glass-secondary" && "btn-secondary",
      // Premium variant
      variant === "premium" && "btn-primary px-8 py-3 text-base font-semibold",
      // Subtle variant
      variant === "subtle" && "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
      // Link style
      variant === "link" && "text-[var(--accent-primary)] underline hover:text-[var(--accent-secondary)]",
      // Size variants
      size === "sm" && "h-9 px-4 py-2 text-xs",
      size === "md" && "h-10 px-6 py-2.5",
      size === "lg" && "h-12 px-8 py-3 text-base",
      className,
    );

    if (withMotion) {
      return (
        <motion.button
          ref={ref}
          className={baseClasses}
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          {...(props as any)}
        />
      );
    }

    return (
      <button
        ref={ref}
        className={baseClasses}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// Motion Button for direct motion control
export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50 disabled:opacity-50 disabled:pointer-events-none",
          variant === "default" && "btn-primary px-6 py-2.5",
          variant === "destructive" && "bg-[var(--accent-danger)] text-white border border-white/20 shadow-lg hover:shadow-xl hover:shadow-[var(--accent-danger)]/25",
          variant === "outline" && "btn-secondary",
          variant === "ghost" && "hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]",
          variant === "glass" && "glass-card px-4 py-2 hover:bg-[var(--surface-hover)] text-[var(--text-primary)]",
          variant === "glass-secondary" && "btn-secondary",
          variant === "link" && "text-[var(--accent-primary)] underline hover:text-[var(--accent-secondary)]",
          size === "sm" && "h-9 px-4 py-2 text-xs",
          size === "md" && "h-10 px-6 py-2.5",
          size === "lg" && "h-12 px-8 py-3 text-base",
          className,
        )}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        {...props}
      />
    );
  },
);
MotionButton.displayName = "MotionButton";