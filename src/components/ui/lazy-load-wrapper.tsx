"use client";

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Wrapper para lazy loading de componentes pesados
 * Incluye un fallback por defecto con spinner
 */
export function LazyLoadWrapper({ 
  children, 
  fallback,
  className = ""
}: LazyLoadWrapperProps) {
  const defaultFallback = (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Cargando...</span>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * HOC para crear componentes lazy con fallback personalizado
 */
export function withLazyLoading<T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function WrappedComponent(props: T) {
    return (
      <LazyLoadWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoadWrapper>
    );
  };
}

/**
 * Hook para lazy loading condicional basado en intersección
 */
export function useIntersectionLazyLoad(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
}