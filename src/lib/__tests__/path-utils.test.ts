import { describe, it, expect } from 'vitest';
import { removeExtension } from '../path-utils';

describe('path-utils', () => {
	describe('removeExtension', () => {
		it('should remove file extension from simple filename', () => {
			expect(removeExtension('file.txt')).toBe('file');
		});

		it('should remove extension from path with directory', () => {
			expect(removeExtension('src/components/App.tsx')).toBe('src/components/App');
		});

		it('should handle files with multiple dots', () => {
			expect(removeExtension('my.component.test.ts')).toBe('my.component.test');
		});

		it('should handle files without extension', () => {
			expect(removeExtension('README')).toBe('README');
		});

		it('should handle hidden files with extension', () => {
			expect(removeExtension('.gitignore')).toBe('.gitignore');
		});

		it('should handle absolute paths', () => {
			expect(removeExtension('/home/user/file.js')).toBe('/home/user/file');
		});

		it('should handle empty directory', () => {
			expect(removeExtension('file.md')).toBe('file');
		});
	});
});
