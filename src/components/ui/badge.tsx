"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "destructive" | "outline" | "secondary";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
	const base = "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors";
	const variants: Record<BadgeVariant, string> = {
		default: "bg-black text-white dark:bg-white dark:text-black border-transparent",
		destructive: "bg-red-600 text-white dark:bg-red-500 border-transparent",
		outline: "border-border bg-transparent text-foreground",
		secondary: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-transparent",
	};
	return <span className={cn(base, variants[variant], className)} {...props} />;
}


