import { describe, it, expect, vi } from 'vitest'
import { delay } from '../delay'

describe('delay', () => {
	it('should resolve after specified milliseconds', async () => {
		const start = Date.now()
		await delay(50)
		const elapsed = Date.now() - start

		// Allow some tolerance for timing
		expect(elapsed).toBeGreaterThanOrEqual(45)
		expect(elapsed).toBeLessThan(100)
	})

	it('should return a promise', () => {
		const result = delay(10)
		expect(result).toBeInstanceOf(Promise)
	})

	it('should resolve with undefined', async () => {
		const result = await delay(10)
		expect(result).toBeUndefined()
	})

	it('should work with zero delay', async () => {
		const start = Date.now()
		await delay(0)
		const elapsed = Date.now() - start

		expect(elapsed).toBeLessThan(50)
	})

	it('should use setTimeout internally', async () => {
		const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

		delay(100)

		expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100)

		setTimeoutSpy.mockRestore()
	})
})
