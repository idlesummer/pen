import { useEffect, useState } from 'react'

export interface MemoryUsage {
  /** Heap memory currently used (in MB) */
  heapUsed: number
  /** Total heap memory allocated (in MB) */
  heapTotal: number
  /** Resident Set Size - total memory allocated for the process (in MB) */
  rss: number
  /** Memory used by C++ objects bound to JavaScript (in MB) */
  external: number
}

/**
 * Hook to monitor Node.js memory usage in real-time
 *
 * @param intervalMs - Polling interval in milliseconds (default: 1000ms)
 * @returns Current memory usage statistics in megabytes
 *
 * @example
 * ```tsx
 * function MemoryDisplay() {
 *   const { heapUsed, heapTotal, rss } = useMemoryMonitor()
 *   return <Text>RAM: {heapUsed}/{heapTotal} MB (RSS: {rss} MB)</Text>
 * }
 * ```
 */
export function useMemoryMonitor(intervalMs = 1000): MemoryUsage {
  const [memory, setMemory] = useState<MemoryUsage>({
    heapUsed: 0,
    heapTotal: 0,
    rss: 0,
    external: 0,
  })

  useEffect(() => {
    const updateMemory = () => {
      const usage = process.memoryUsage()
      setMemory({
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      })
    }

    // Get initial reading immediately
    updateMemory()

    const interval = setInterval(updateMemory, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])

  return memory
}
