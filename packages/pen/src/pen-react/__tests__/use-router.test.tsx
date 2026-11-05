import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { NavigationProvider } from '../view/navigation/NavigationProvider'
import { useRoute } from '../view/navigation/hooks/use-route'
import { useRouter } from '../view/navigation/hooks/use-router'

async function tick() {
  await new Promise(resolve => setTimeout(resolve, 50))
}

describe('useRouter', () => {
  test('returns the navigation actions', () => {
    function Harness() {
      const router = useRouter()
      return <Text>{Object.keys(router).sort().join(',')}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <Harness />
      </NavigationProvider>,
    )
    expect(lastFrame()).toBe('back,forward,push,refresh,replace')
  })

  test('its actions mutate the shared navigation state', async () => {
    let router: ReturnType<typeof useRouter>
    function RouterHarness() {
      router = useRouter()
      return null
    }
    function RouteHarness() {
      return <Text>{useRoute()}</Text>
    }
    const { lastFrame } = render(
      <NavigationProvider>
        <RouterHarness />
        <RouteHarness />
      </NavigationProvider>,
    )
    router!.push('/about')
    await tick()
    expect(lastFrame()).toBe('/about')
  })

  test('does not itself subscribe the calling component to navigation changes', async () => {
    let renderCount = 0
    let router: ReturnType<typeof useRouter>
    function RouterOnlyHarness() {
      renderCount++
      router = useRouter()
      return null
    }
    function RouteHarness() {
      return <Text>{useRoute()}</Text>
    }
    render(
      <NavigationProvider>
        <RouterOnlyHarness />
        <RouteHarness />
      </NavigationProvider>,
    )
    expect(renderCount).toBe(1)
    router!.push('/about')
    await tick()
    expect(renderCount).toBe(1)
  })
})
