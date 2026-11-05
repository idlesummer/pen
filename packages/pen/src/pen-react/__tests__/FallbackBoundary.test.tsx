import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ErrorBoundary } from '../modules/components/ErrorBoundary'
import { FallbackBoundary, showFallback } from '../modules/components/FallbackBoundary'

describe('FallbackBoundary', () => {
  test('renders children when nothing throws', () => {
    const { lastFrame } = render(
      <FallbackBoundary route="/" params={{}}>
        <Text>fine</Text>
      </FallbackBoundary>,
    )
    expect(lastFrame()).toBe('fine')
  })

  test('catches showFallback() and renders the built-in fallback', () => {
    function CallsShowFallback() {
      showFallback()
      return null
    }
    const { lastFrame } = render(
      <FallbackBoundary route="/" params={{}}>
        <CallsShowFallback />
      </FallbackBoundary>,
    )
    expect(lastFrame()).toBe('Page Not Found')
  })

  test('renders a custom Fallback with the bound params', () => {
    function CallsShowFallback() {
      showFallback()
      return null
    }
    const { lastFrame } = render(
      <FallbackBoundary route="/" params={{ id: '42' }} Fallback={({ params }) => <Text>not found: {params.id}</Text>}>
        <CallsShowFallback />
      </FallbackBoundary>,
    )
    expect(lastFrame()).toBe('not found: 42')
  })

  test('does not catch a plain error - it passes through to the nearest ErrorBoundary', () => {
    function Boom(): never {
      throw new Error('boom')
    }
    const { lastFrame } = render(
      <ErrorBoundary route="/">
        <FallbackBoundary route="/" params={{}}>
          <Boom />
        </FallbackBoundary>
      </ErrorBoundary>,
    )
    expect(lastFrame()).toContain('Something went wrong: boom')
  })
})
