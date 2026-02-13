import { Box, Text } from 'ink'
import { useState, useEffect } from 'react'
import { useMemoryMonitor } from '@idlesummer/pen/lib/hooks'

export default function HomeScreen() {
  const memory = useMemoryMonitor(500) // Update every 500ms
  const [dataSize, setDataSize] = useState(0)
  const [data, setData] = useState<number[]>([])

  // Calculate usage percentages
  const heapUsagePercent = memory.heapTotal > 0
    ? Math.round((memory.heapUsed / memory.heapTotal) * 100)
    : 0

  // Simulate memory allocation
  const allocateMemory = (mbSize: number) => {
    // Allocate approximately mbSize MB of memory (rough estimate)
    const itemsToAllocate = mbSize * 125000 // ~1MB per 125k numbers
    const newData = Array.from({ length: itemsToAllocate }, (_, i) => i * Math.random())
    setData(prev => [...prev, ...newData])
    setDataSize(prev => prev + mbSize)
  }

  const clearMemory = () => {
    setData([])
    setDataSize(0)
    // Force garbage collection if available (requires --expose-gc flag)
    if (global.gc) {
      global.gc()
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1}>
        <Text bold color="blue">Memory Statistics (Updates every 500ms)</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text color="yellow">Heap Used:    </Text>
            <Text bold>{memory.heapUsed} MB</Text>
            <Text dimColor> / {memory.heapTotal} MB</Text>
            <Text color="magenta"> ({heapUsagePercent}%)</Text>
          </Text>
          <Text>
            <Text color="yellow">RSS:          </Text>
            <Text bold>{memory.rss} MB</Text>
            <Text dimColor> (Total process memory)</Text>
          </Text>
          <Text>
            <Text color="yellow">External:     </Text>
            <Text bold>{memory.external} MB</Text>
            <Text dimColor> (C++ objects)</Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor="green" padding={1}>
        <Text bold color="green">Memory Allocation Simulator</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text color="cyan">Allocated: </Text>
            <Text bold>{dataSize} MB</Text>
            <Text dimColor> (~{data.length.toLocaleString()} items)</Text>
          </Text>
          <Box marginTop={1} gap={1}>
            <Text dimColor>Press: </Text>
            <Text><Text color="green">1</Text> +1MB</Text>
            <Text><Text color="green">5</Text> +5MB</Text>
            <Text><Text color="green">0</Text> +10MB</Text>
            <Text><Text color="red">c</Text> Clear</Text>
          </Box>
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        <Text bold dimColor>About Memory Metrics</Text>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>• <Text bold>Heap Used:</Text> JavaScript objects in memory</Text>
          <Text dimColor>• <Text bold>Heap Total:</Text> Allocated heap space</Text>
          <Text dimColor>• <Text bold>RSS:</Text> Total memory (heap + code + stack)</Text>
          <Text dimColor>• <Text bold>External:</Text> C++ objects (buffers, etc.)</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press <Text bold>q</Text> to quit</Text>
      </Box>

      {/* Hidden input handler */}
      <KeyHandler
        onKey={(key) => {
          if (key === '1') allocateMemory(1)
          else if (key === '5') allocateMemory(5)
          else if (key === '0') allocateMemory(10)
          else if (key === 'c') clearMemory()
        }}
      />
    </Box>
  )
}

// Simple key handler component
function KeyHandler({ onKey }: { onKey: (key: string) => void }) {
  useEffect(() => {
    const handleData = (data: Buffer) => {
      const key = data.toString()
      onKey(key)
    }

    process.stdin.on('data', handleData)
    return () => {
      process.stdin.off('data', handleData)
    }
  }, [onKey])

  return null
}
