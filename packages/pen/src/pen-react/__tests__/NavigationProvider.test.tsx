import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { useNavigationStore } from '../view/navigation/NavigationProvider'

describe('useNavigationStore', () => {
  test('throws when used outside a NavigationProvider', () => {
    function Harness() {
      useNavigationStore()
      return <Text>unreachable</Text>
    }
    const { lastFrame } = render(
      <ReactErrorBoundary fallbackRender={({ error }) => <Text>{(error as Error).message}</Text>}>
        <Harness />
      </ReactErrorBoundary>,
    )
    expect(lastFrame()).toBe('Navigation hooks must be used within a NavigationProvider')
  })
})
