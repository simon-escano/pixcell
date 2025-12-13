import { cache } from 'react';
import { unstable_cache } from 'next/cache';

/**
 * Cache configuration constants
 */
export const CACHE_TAGS = {
  patients: 'patients',
  samples: 'samples',
  reports: 'reports',
  users: 'users',
  profiles: 'profiles',
  organizations: 'organizations',
  feedback: 'feedback',
} as const;

export const CACHE_REVALIDATE_TIMES = {
  // Time-based revalidation (in seconds)
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  default: 300, // 5 minutes
} as const;

/**
 * Wraps a function with React cache for request-level deduplication
 * Use this for functions that should be deduplicated within a single request
 */
export function withRequestCache<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return cache(fn) as T;
}

/**
 * Wraps a function with Next.js unstable_cache for persistent caching
 * Use this for functions that should be cached across requests
 * 
 * @param fn - The function to cache
 * @param keyParts - Parts that make up the cache key
 * @param tags - Cache tags for on-demand revalidation
 * @param revalidate - Time in seconds before cache expires (time-based revalidation)
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  options?: {
    tags?: string[];
    revalidate?: number;
  }
): T {
  const cacheKey = keyParts.join('-');
  const tags = options?.tags || [];
  const revalidate = options?.revalidate ?? CACHE_REVALIDATE_TIMES.default;

  return unstable_cache(
    fn,
    [cacheKey],
    {
      tags,
      revalidate,
    }
  ) as T;
}

