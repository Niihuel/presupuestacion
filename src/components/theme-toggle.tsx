"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	
	useEffect(() => setMounted(true), []);
	
	if (!mounted) {
		return (
			<div className="h-9 w-9 rounded-lg bg-[var(--surface-primary)] animate-pulse" />
		);
	}
	
	const isDark = theme === "dark";
	
	return (
		<motion.button
			onClick={() => setTheme(isDark ? "light" : "dark")}
			className={cn(
				"relative h-9 w-9 rounded-lg transition-all duration-200",
				"bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)]",
				"border border-[var(--surface-border)] hover:border-[var(--accent-primary)]/30",
				"backdrop-blur-md shadow-sm hover:shadow-md",
				"focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
			)}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
		>
			{/* Background glow effect */}
			<motion.div
				className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent"
				animate={{
					opacity: isDark ? 0.8 : 0.3
				}}
				transition={{ duration: 0.3 }}
			/>
			
			{/* Icon container */}
			<div className="relative z-10 flex h-full w-full items-center justify-center">
				<motion.div
					key={isDark ? "moon" : "sun"}
					initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
					animate={{ opacity: 1, rotate: 0, scale: 1 }}
					exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
					transition={{
						duration: 0.3,
						ease: "easeInOut"
					}}
				>
					{isDark ? (
						<Moon 
							size={16} 
							className="text-blue-400 drop-shadow-sm" 
						/>
					) : (
						<Sun 
							size={16} 
							className="text-amber-500 drop-shadow-sm" 
						/>
					)}
				</motion.div>
			</div>
			
			{/* Subtle inner shadow for depth */}
			<div className="absolute inset-0.5 rounded-md bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
		</motion.button>
	);
}


