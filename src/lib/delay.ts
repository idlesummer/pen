// src/lib/delay.ts
/**
 * Wait for a specified number of milliseconds
 * Useful for testing and demos
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
