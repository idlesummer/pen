import { Box, Text } from 'ink'
import { useState, useEffect } from 'react'
import { useMemoryMonitor } from '@idlesummer/pen'
import { BarChart } from '../components/bar-chart.js'

export default function HomeScreen() {
  const memory = useMemoryMonitor(500) // Update every 500ms
  const [dataSize, setDataSize] = useState(0)
  const [data, setData] = useState<number[]>([])

  // Track peak RSS to scale bars dynamically
  const [peakRss, setPeakRss] = useState(0)
  useEffect(() => {
    if (memory.rss > peakRss) setPeakRss(memory.rss)
  }, [memory.rss, peakRss])

  // Use a sensible max for the chart: at least 1.5x peak RSS or 100 MB
  const chartMax = Math.max(Math.round(peakRss * 1.5), 100)

  // Simulate memory allocation
  const allocateMemory = (mbSize: number) => {
    const itemsToAllocate = mbSize * 125000
    const newData = Array.from({ length: itemsToAllocate }, (_, i) => i * Math.random())
    setData(prev => [...prev, ...newData])
    setDataSize(prev => prev + mbSize)
  }

  const clearMemory = () => {
    setData([])
    setDataSize(0)
    if (global.gc) {
      global.gc()
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      <BarChart
        title="Memory Usage"
        titleColor="blue"
        barWidth={36}
        items={[
          {
            label: 'Heap Used',
            value: memory.heapUsed,
            maxValue: memory.heapTotal,
            color: 'green',
          },
          {
            label: 'Heap Total',
            value: memory.heapTotal,
            maxValue: chartMax,
            color: 'cyan',
          },
          {
            label: 'RSS',
            value: memory.rss,
            maxValue: chartMax,
            color: 'magenta',
          },
          {
            label: 'External',
            value: memory.external,
            maxValue: chartMax,
            color: 'yellow',
          },
        ]}
      />

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
