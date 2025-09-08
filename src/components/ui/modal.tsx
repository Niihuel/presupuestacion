"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ModalProps = {
	open: boolean;
	onOpenChange?: (open: boolean) => void;
	onClose?: () => void;
	title?: string;
	children: React.ReactNode;
	className?: string;
};

export function Modal({ open, onOpenChange, onClose, title, children, className }: ModalProps) {
	React.useEffect(() => {
		if (open) document.body.style.overflow = "hidden";
		else document.body.style.overflow = "";
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	const handleClose = () => {
		if (onClose) onClose();
		if (onOpenChange) onOpenChange(false);
	};

	if (!open) return null;
	return (
		<AnimatePresence>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
					{/* Discord-style overlay with dark background */}
					<motion.div 
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 bg-black/80" 
						onClick={handleClose} 
					/>
					
					{/* Discord-style modal content with animation */}
					<motion.div 
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						transition={{ 
							type: "spring",
							duration: 0.3,
							bounce: 0.15
						}}
						className={cn(
							"relative z-10 w-full max-w-md md:max-w-lg rounded-lg border bg-background shadow-xl",
							"flex flex-col max-h-[85vh]", // Set max height for scrolling
							className
						)}
					>
						{/* Modal header */}
						<div className="border-b px-4 py-3 flex items-center justify-between">
							<div className="text-base font-medium">{title}</div>
							<button 
								className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" 
								onClick={handleClose}
								aria-label="Cerrar modal"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						
						{/* Modal content with scrolling */}
						<div className="p-5 overflow-y-auto custom-scrollbar flex-1">
							{children}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}