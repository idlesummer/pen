import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { NavigationProvider } from '../view/navigation/NavigationProvider'
import { useNavigate } from '../view/navigation/hooks/use-navigate'
import { useRouter } from '../view/navigation/hooks/use-router'

async function tick() {
  await new Promise(resolve => setTimeout(resolve, 50))
}

describe('useNavigate', () => {
  test('returns the full navigation state', () => {
    function Harness() {
      const { history, position, refreshes } = useNavigate()
      return <Text>{JSON.stringify({ history, position, refreshes })}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )
    expect(lastFrame()).toBe(JSON.stringify({ history: ['/'], position: 0, refreshes: 0 }))
  })

  test('reflects push, back, and refresh as they happen', async () => {
    let router: ReturnType<typeof useRouter>
    function Harness() {
      router = useRouter()
      const { history, position, refreshes } = useNavigate()
      return <Text>{JSON.stringify({ history, position, refreshes })}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )

    router!.push('/about')
    await tick()
    expect(lastFrame()).toBe(JSON.stringify({ history: ['/', '/about'], position: 1, refreshes: 0 }))

    router!.back()
    await tick()
    expect(lastFrame()).toBe(JSON.stringify({ history: ['/', '/about'], position: 0, refreshes: 0 }))

    router!.refresh()
    await tick()
    expect(lastFrame()).toBe(JSON.stringify({ history: ['/', '/about'], position: 0, refreshes: 1 }))
  })
})
