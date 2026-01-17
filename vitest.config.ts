import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Use happy-dom for DOM simulation (faster than jsdom)
		environment: 'happy-dom',

		// Include test files
		include: ['src/**/__tests__/**/*.test.{ts,tsx}'],

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/__tests__/**',
				'src/**/*.test.{ts,tsx}',
				'src/bin.ts', // CLI entry point
				'src/index.ts', // Library exports
			],
		},

		// Global test configuration
		globals: true,

		// Setup files (if needed later)
		// setupFiles: ['./vitest.setup.ts'],
	},
});
