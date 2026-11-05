import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { NavigationProvider } from '../view/navigation/NavigationProvider'
import { useRoute } from '../view/navigation/hooks/use-route'
import { useRouter } from '../view/navigation/hooks/use-router'

async function tick() {
  await new Promise(resolve => setTimeout(resolve, 50))
}

describe('useRoute', () => {
  test('returns the current route', () => {
    function Harness() {
      return <Text>{useRoute()}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )
    expect(lastFrame()).toBe('/')
  })

  test('updates after a navigation change', async () => {
    let router: ReturnType<typeof useRouter>
    function Harness() {
      router = useRouter()
      return <Text>{useRoute()}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )
    router!.push('/about')
    await tick()
    expect(lastFrame()).toBe('/about')
  })
})
