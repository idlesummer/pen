import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { NavigationProvider } from '../view/navigation/NavigationProvider'
import { useHistory } from '../view/navigation/hooks/use-history'
import { useRouter } from '../view/navigation/hooks/use-router'

async function tick() {
  await new Promise(resolve => setTimeout(resolve, 50))
}

describe('useHistory', () => {
  test('returns the visited-route stack and current position', () => {
    function Harness() {
      const { stack, position } = useHistory()
      return <Text>{JSON.stringify({ stack, position })}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )
    expect(lastFrame()).toBe(JSON.stringify({ stack: ['/'], position: 0 }))
  })

  test('updates after a push', async () => {
    let router: ReturnType<typeof useRouter>
    function Harness() {
      router = useRouter()
      const { stack, position } = useHistory()
      return <Text>{JSON.stringify({ stack, position })}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )
    router!.push('/about')
    await tick()
    expect(lastFrame()).toBe(JSON.stringify({ stack: ['/', '/about'], position: 1 }))
  })
})
