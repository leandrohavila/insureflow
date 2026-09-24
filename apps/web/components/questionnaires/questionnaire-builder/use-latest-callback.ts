import { useCallback, useRef } from "react"

/** Stable callback identity so memoized rows do not rerender when parents pass inline handlers. */
export function useLatestCallback<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  const ref = useRef(fn)
  ref.current = fn
  return useCallback((...args: Args) => ref.current(...args), [])
}
