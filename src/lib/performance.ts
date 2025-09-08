/**
 * Utilidades para optimización de performance
 */

/**
 * Debounce function para reducir llamadas frecuentes
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function para limitar frecuencia de ejecución
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoización simple para funciones puras
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Limpiador de cache con TTL
 */
export class CacheManager<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 300000) { // 5 minutos por defecto
    this.defaultTTL = defaultTTL;
  }

  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Instancia global del cache manager
 */
export const globalCache = new CacheManager();

/**
 * Optimizador de consultas SQL para Prisma
 */
export class QueryOptimizer {
  /**
   * Campos comunes para selección optimizada
   */
  static readonly COMMON_SELECTS = {
    user: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
    customer: {
      id: true,
      companyName: true,
      displayName: true,
      email: true,
    },
    project: {
      id: true,
      name: true,
      description: true,
    },
    budget: {
      id: true,
      version: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  };

  /**
   * Genera un select optimizado basado en los campos necesarios
   */
  static optimizeSelect(fields: string[], entityType: keyof typeof QueryOptimizer.COMMON_SELECTS) {
    const commonFields = QueryOptimizer.COMMON_SELECTS[entityType];
    const select: Record<string, boolean> = {};

    // Incluir campos comunes
    Object.keys(commonFields).forEach(field => {
      select[field] = true;
    });

    // Incluir campos adicionales solicitados
    fields.forEach(field => {
      select[field] = true;
    });

    return select;
  }

  /**
   * Optimiza paginación con cursor en lugar de offset
   */
  static optimizePagination(
    cursor?: string,
    take = 20,
    orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
  ) {
    const config: any = {
      take,
      orderBy,
    };

    if (cursor) {
      config.cursor = { id: cursor };
      config.skip = 1; // Saltar el cursor
    }

    return config;
  }
}

/**
 * Monitor de performance para desarrollo
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      console.warn(`No se encontró medición para: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(label);
    }
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(label);
    }
  }
}

/**
 * Utilidades para optimización de imágenes
 */
export class ImageOptimizer {
  /**
   * Genera URLs optimizadas para Next.js Image
   */
  static optimizeImageUrl(
    src: string,
    width: number,
    height?: number,
    quality = 75
  ): string {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: quality.toString(),
    });

    if (height) {
      params.set('h', height.toString());
    }

    return `/_next/image?${params.toString()}`;
  }

  /**
   * Genera srcSet para imágenes responsive
   */
  static generateSrcSet(src: string, widths: number[], quality = 75): string {
    return widths
      .map(width => `${this.optimizeImageUrl(src, width, undefined, quality)} ${width}w`)
      .join(', ');
  }
}
