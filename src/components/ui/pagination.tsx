"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Standardized pagination component for CRUD pages
 * To be used in all list views for consistent UI
 */
export function Pagination({ 
  currentPage, 
  hasNextPage, 
  onPageChange,
  className
}: PaginationProps) {
  return (
    <Card className={`mt-6 ${className || ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm justify-end">
          <Button 
            variant="outline" 
            disabled={currentPage <= 1} 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            Anterior
          </Button>
          <span className="mx-2">Página {currentPage}</span>
          <Button 
            variant="outline" 
            disabled={!hasNextPage} 
            onClick={() => onPageChange(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Pagination;