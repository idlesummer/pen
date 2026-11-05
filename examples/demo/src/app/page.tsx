// src/app/page.tsx
import { useState, useEffect } from 'react'
import { Text } from 'ink'

export default function RootPage() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setCount(c => c + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return <Text color="green">Count: {count}</Text>
}
