import { useMemo, useCallback } from 'react';

interface DataProcessingHookResult {
  processDataBatch: (data: string[][], batchSize?: number) => Promise<string[][]>;
  debounce: <T extends (...args: any[]) => void>(func: T, wait: number) => T;
  memoizeOne: <Args extends readonly unknown[], Return>(
    fn: (...args: Args) => Return
  ) => (...args: Args) => Return;
}

export const useOptimizedDataProcessing = (): DataProcessingHookResult => {
  // Process data in batches to avoid blocking the main thread
  const processDataBatch = useCallback(async (
    data: string[][], 
    batchSize: number = 100
  ): Promise<string[][]> => {
    const result: string[][] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Use requestIdleCallback for non-blocking processing
      await new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            result.push(...batch);
            resolve(void 0);
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            result.push(...batch);
            resolve(void 0);
          }, 0);
        }
      });
    }
    
    return result;
  }, []);

  // Debounce function for expensive operations
  const debounce = useCallback(<T extends (...args: any[]) => void>(
    func: T, 
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout;
    
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }, []);

  // Simple memoization for expensive computations
  const memoizeOne = useCallback(<Args extends readonly unknown[], Return>(
    fn: (...args: Args) => Return
  ) => {
    let lastArgs: Args | undefined;
    let lastResult: Return;
    
    return (...args: Args): Return => {
      if (!lastArgs || !shallowEqual(args, lastArgs)) {
        lastArgs = args;
        lastResult = fn(...args);
      }
      return lastResult;
    };
  }, []);

  return { processDataBatch, debounce, memoizeOne };
};

// Helper function for shallow equality check
function shallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}