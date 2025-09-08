"use client";

import * as React from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent } from "./card";

interface SearchSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
}

export function SearchSelect({
  value,
  onValueChange,
  placeholder = "Seleccione una opción",
  searchPlaceholder = "Buscar...",
  options = [],
  disabled = false,
  className,
  emptyText = "No se encontraron resultados"
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.description?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-9"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpen(false)}
          />
          <Card className="absolute top-full left-0 right-0 z-20 mt-1 shadow-lg">
            <CardContent className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
              
              <div className="max-h-60 overflow-auto">
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {emptyText}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredOptions.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent",
                          value === option.value && "bg-accent"
                        )}
                        onClick={() => handleSelect(option.value)}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
