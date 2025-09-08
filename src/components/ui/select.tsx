"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

// Context for managing select state
const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}>({});

export const Select = React.forwardRef<HTMLSelectElement, SelectProps & { children?: React.ReactNode; placeholder?: string }>(
	({ className, onValueChange, onChange, children, value, placeholder, ...props }, ref) => {
		// If children are provided, use context-based approach
		if (children) {
			return (
				<SelectContext.Provider value={{ value: typeof value === 'string' ? value : undefined, onValueChange, placeholder }}>
					<select
						ref={ref}
						className={cn("h-9 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}
						value={value}
						onChange={(e) => {
							onChange?.(e);
							onValueChange?.(e.target.value);
						}}
						{...props}
					>
						{children}
					</select>
				</SelectContext.Provider>
			);
		}
		
		// Fallback to basic select
		return (
			<select
				ref={ref}
				className={cn("h-9 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}
				onChange={(e) => {
					onChange?.(e);
					onValueChange?.(e.target.value);
				}}
				{...props}
			/>
		);
	},
);
Select.displayName = "Select";

// Compatibility exports for Radix-style API
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ children, ...props }, ref) => (
  <option ref={ref} {...props}>
    {children}
  </option>
));
SelectItem.displayName = "SelectItem";

export const SelectTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => <>{children}</>;

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext);
  return null; // The placeholder is handled by the select element itself
};