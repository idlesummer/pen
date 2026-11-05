import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ErrorBoundary } from '../modules/components/ErrorBoundary'
import { FallbackBoundary, showFallback } from '../modules/components/FallbackBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  test('renders children when nothing throws', () => {
    const { lastFrame } = render(
      <ErrorBoundary route="/">
        <Text>fine</Text>
      </ErrorBoundary>,
    )
    expect(lastFrame()).toBe('fine')
  })

  test('catches a thrown error and renders the built-in fallback', () => {
    const { lastFrame } = render(
      <ErrorBoundary route="/">
        <Boom />
      </ErrorBoundary>,
    )
    expect(lastFrame()).toContain('Something went wrong: boom')
  })

  test('renders a custom Fallback with the caught error', () => {
    const { lastFrame } = render(
      <ErrorBoundary route="/" Fallback={({ error }) => <Text>custom: {error.message}</Text>}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(lastFrame()).toBe('custom: boom')
  })

  test('does not catch a FallbackSignal - it passes through to the nearest FallbackBoundary', () => {
    function CallsShowFallback() {
      showFallback()
      return null
    }
    const { lastFrame } = render(
      <FallbackBoundary route="/" params={{}}>
        <ErrorBoundary route="/">
          <CallsShowFallback />
        </ErrorBoundary>
      </FallbackBoundary>,
    )
    expect(lastFrame()).toBe('Page Not Found')
  })
})
