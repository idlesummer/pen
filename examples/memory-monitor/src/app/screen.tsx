import { Box, Text } from 'ink'
import { useState, useEffect } from 'react'
import { useMemoryMonitor } from '@idlesummer/pen'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from '../components/bar-chart.js'

export default function HomeScreen() {
  const memory = useMemoryMonitor(500)
  const [dataSize, setDataSize] = useState(0)
  const [data, setData] = useState<number[]>([])

  const chartData = [
    { name: 'Heap Used', value: memory.heapUsed, fill: 'green' },
    { name: 'Heap Total', value: memory.heapTotal, fill: 'cyan' },
    { name: 'RSS', value: memory.rss, fill: 'magenta' },
    { name: 'External', value: memory.external, fill: 'yellow' },
  ]

  const allocateMemory = (mbSize: number) => {
    const itemsToAllocate = mbSize * 125000
    const newData = Array.from(
      { length: itemsToAllocate },
      (_, i) => i * Math.random(),
    )
    setData((prev) => [...prev, ...newData])
    setDataSize((prev) => prev + mbSize)
  }

  const clearMemory = () => {
    setData([])
    setDataSize(0)
    if (global.gc) global.gc()
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
      >
        <Text bold>Memory Usage</Text>
        <Text dimColor>Live statistics from useMemoryMonitor</Text>
        <Box marginTop={1}>
          <BarChart data={chartData} height={10}>
            <CartesianGrid />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" unit=" MB" />
          </BarChart>
        </Box>
      </Box>
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        padding={1}
      >
        <Text bold dimColor>
          About Memory Metrics
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>
            {'• '}
            <Text bold>Heap Used:</Text> JavaScript objects in memory
          </Text>
          <Text dimColor>
            {'• '}
            <Text bold>Heap Total:</Text> Allocated heap space
          </Text>
          <Text dimColor>
            {'• '}
            <Text bold>RSS:</Text> Total memory (heap + code + stack)
          </Text>
          <Text dimColor>
            {'• '}
            <Text bold>External:</Text> C++ objects (buffers, etc.)
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Press <Text bold>q</Text> to quit
        </Text>
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
      onKey(data.toString())
    }
    process.stdin.on('data', handleData)
    return () => {
      process.stdin.off('data', handleData)
    }
  }, [onKey])

  return null
}
