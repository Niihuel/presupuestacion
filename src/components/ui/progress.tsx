"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
	value?: number; // 0 - 100
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
	const clamped = Math.max(0, Math.min(100, value));
	return (
		<div className={cn("relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800", className)} {...props}>
			<div
				className="h-full bg-black dark:bg-white transition-all"
				style={{ width: `${clamped}%` }}
			/>
		</div>
	);
}


