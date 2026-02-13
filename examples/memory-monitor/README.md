# Memory Monitor Example

This example demonstrates the `useMemoryMonitor` hook from `@idlesummer/pen`.

## What it shows

- **Real-time memory monitoring** - Updates every 500ms to show current memory usage
- **Memory metrics** - Displays heap used, heap total, RSS, and external memory
- **Interactive simulation** - Allocate and free memory to see stats change in real-time
- **Usage percentages** - Shows heap usage as a percentage

## Memory Metrics Explained

| Metric | Description |
|--------|-------------|
| **Heap Used** | Memory currently occupied by JavaScript objects |
| **Heap Total** | Total heap memory allocated by V8 |
| **RSS** | Resident Set Size - total memory allocated for the process (includes heap, code, stack) |
| **External** | Memory used by C++ objects bound to JavaScript (like Buffers) |

## Hook Usage

```tsx
import { useMemoryMonitor } from '@idlesummer/pen/lib/hooks'

function MyComponent() {
  const { heapUsed, heapTotal, rss, external } = useMemoryMonitor(1000) // Poll every 1000ms

  return (
    <Text>Heap: {heapUsed} MB / {heapTotal} MB</Text>
  )
}
```

## Running the Example

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start the app
npm start
```

## Interactive Controls

- **1** - Allocate ~1 MB of memory
- **5** - Allocate ~5 MB of memory
- **0** - Allocate ~10 MB of memory
- **c** - Clear allocated memory
- **q** - Quit the application

## Use Cases

The memory monitor hook is useful for:

- Debugging memory leaks in long-running CLI applications
- Monitoring resource usage in production
- Displaying system stats in dashboards
- Development tools and diagnostics
- Performance optimization

## Hook API

```typescript
function useMemoryMonitor(intervalMs?: number): MemoryUsage

interface MemoryUsage {
  heapUsed: number   // MB
  heapTotal: number  // MB
  rss: number        // MB
  external: number   // MB
}
```

### Parameters

- `intervalMs` (optional) - Polling interval in milliseconds. Default: `1000`

### Returns

`MemoryUsage` object with all values in megabytes (MB).
