/** Wraps a callback in a trailing-edge debounced function.
 *
 *  Delays execution until calls stop for the given duration.
 *
 *  @param fn - The function to execute.
 *  @param ms - The delay in milliseconds.
 *  @returns The debounced function.
 */
export function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined

  const debouncedFn = () => {
    // If timer has not been set yet, then clearTimer no-ops
    clearTimeout(timer)
    timer = setTimeout(fn, ms)
  }
  return debouncedFn
}
