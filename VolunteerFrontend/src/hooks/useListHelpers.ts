import { useEffect, useRef, useState } from 'react';

/** Value that follows `value` after it has been stable for `ms` (search boxes: one request per pause, not per keystroke). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Page offset that is automatically 0 whenever the filters change.
 * Derived (no effect), so a filter change produces exactly one request with skip=0
 * instead of a request with the stale offset followed by a second one.
 */
export function usePaging(filterKey: string): [number, (skip: number) => void] {
  const [page, setPage] = useState({ skip: 0, key: filterKey });
  const skip = page.key === filterKey ? page.skip : 0;
  return [skip, (n: number) => setPage({ skip: n, key: filterKey })];
}

/** Guards against out-of-order responses: `const isCurrent = begin(); await …; if (!isCurrent()) return;` */
export function useLatestRequest() {
  const counter = useRef(0);
  return () => {
    const id = ++counter.current;
    return () => id === counter.current;
  };
}
