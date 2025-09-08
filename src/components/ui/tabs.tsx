"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value?: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children?: React.ReactNode;
};

export const Tabs: React.FC<TabsProps> = ({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}) => {
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = React.useCallback(
    (v: string) => {
      onValueChange?.(v);
      if (!isControlled) setInternal(v);
    },
    [isControlled, onValueChange]
  );

  React.useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternal(defaultValue);
    }
  }, [defaultValue, isControlled]);

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export type TabsListProps = React.HTMLAttributes<HTMLDivElement>;
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "inline-flex items-center justify-start rounded-md border border-border p-1 gap-1",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

export type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsTrigger must be used within <Tabs>");
    const selected = ctx.value === value;
    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={selected}
        data-state={selected ? "active" : "inactive"}
        onClick={(e) => {
          props.onClick?.(e);
          ctx.setValue(value);
        }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50 disabled:pointer-events-none",
          selected
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "hover:bg-gray-100 dark:hover:bg-gray-900",
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};
export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, hidden, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsContent must be used within <Tabs>");
    const selected = ctx.value === value;
    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={selected ? "active" : "inactive"}
        hidden={!selected}
        className={cn("mt-2 outline-none focus-visible:ring-1", className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";
