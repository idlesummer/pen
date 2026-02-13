import { Box, Text } from 'ink'
import { useState, useEffect, useRef } from 'react'
import { useMemoryMonitor } from '@idlesummer/pen'
import {
  BarChart,
  Bar,
  CartesianGrid,
  YAxis,
} from '../components/bar-chart.js'

const WINDOW_SIZE = 40 // 40 ticks × 500ms = 20 seconds

interface HistoryEntry {
  heapUsed: number
  rss: number
}

export default function HomeScreen() {
  const memory = useMemoryMonitor(500)
  const [dataSize, setDataSize] = useState(0)
  const [data, setData] = useState<number[]>([])

  // ── Sliding window history ──
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const memoryRef = useRef(memory)
  memoryRef.current = memory

  useEffect(() => {
    const id = setInterval(() => {
      const m = memoryRef.current
      setHistory((prev) => {
        const next = [...prev, { heapUsed: m.heapUsed, rss: m.rss }]
        return next.length > WINDOW_SIZE ? next.slice(-WINDOW_SIZE) : next
      })
    }, 500)
    return () => clearInterval(id)
  }, [])

  const chartData = history.map((entry) => ({
    heapUsed: entry.heapUsed,
    rss: entry.rss,
  }))

  // ── Memory allocation simulator ──
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
      {/* ── Sliding window chart ── */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
      >
        <Text bold>Memory Usage</Text>
        <Text dimColor>Sliding window — last {WINDOW_SIZE / 2}s</Text>
        <Box marginTop={1}>
          <BarChart
            data={chartData}
            height={8}
            barSize={1}
            barGap={0}
            barCategoryGap={0}
          >
            <CartesianGrid />
            <YAxis />
            <Bar dataKey="heapUsed" fill="green" name="Heap Used" />
          </BarChart>
        </Box>
        <Box marginTop={1} gap={2}>
          <Text>
            <Text color="green" bold>
              {memory.heapUsed}
            </Text>
            <Text dimColor>/{memory.heapTotal} MB heap</Text>
          </Text>
          <Text>
            <Text color="magenta" bold>
              {memory.rss}
            </Text>
            <Text dimColor> MB rss</Text>
          </Text>
          <Text>
            <Text color="yellow" bold>
              {memory.external}
            </Text>
            <Text dimColor> MB ext</Text>
          </Text>
        </Box>
      </Box>

      {/* ── Allocation simulator ── */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="green"
        padding={1}
      >
        <Text bold color="green">
          Memory Allocation Simulator
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text color="cyan">Allocated: </Text>
            <Text bold>{dataSize} MB</Text>
            <Text dimColor> (~{data.length.toLocaleString()} items)</Text>
          </Text>
          <Box marginTop={1} gap={1}>
            <Text dimColor>Press: </Text>
            <Text>
              <Text color="green">1</Text> +1MB
            </Text>
            <Text>
              <Text color="green">5</Text> +5MB
            </Text>
            <Text>
              <Text color="green">0</Text> +10MB
            </Text>
            <Text>
              <Text color="red">c</Text> Clear
            </Text>
          </Box>
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
