import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useUrl } from '../use-url'
import { RouterProvider } from '../../RouterProvider'

// Helper component to test the hook
function TestComponent() {
	const url = useUrl()
	return <div data-testid="url">{url}</div>
}

describe('useUrl', () => {
	it('should return the current URL from router context', () => {
		const { getByTestId } = render(
			<RouterProvider initialUrl="/home">
				<TestComponent />
			</RouterProvider>,
		)

		expect(getByTestId('url').textContent).toBe('/home')
	})

	it('should return different URL when initialUrl changes', () => {
		const { getByTestId } = render(
			<RouterProvider initialUrl="/about">
				<TestComponent />
			</RouterProvider>,
		)

		expect(getByTestId('url').textContent).toBe('/about')
	})

	it('should throw error when used outside RouterProvider', () => {
		// Suppress console.error for this test
		const originalError = console.error
		console.error = () => {}

		expect(() => {
			render(<TestComponent />)
		}).toThrow('useRouter must be used within a RouterProvider')

		console.error = originalError
	})
})
