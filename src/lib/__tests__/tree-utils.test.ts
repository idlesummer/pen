import { describe, it, expect } from 'vitest';
import {
	traverseBreadthFirst,
	traverseDepthFirst,
	collectAncestors,
} from '../tree-utils';

// Test tree structure
type TreeNode = {
	value: string;
	children?: TreeNode[];
	parent?: TreeNode;
};

describe('tree-utils', () => {
	describe('traverseBreadthFirst', () => {
		it('should visit nodes in breadth-first order', () => {
			const root: TreeNode = {
				value: 'A',
				children: [
					{ value: 'B', children: [{ value: 'D' }, { value: 'E' }] },
					{ value: 'C', children: [{ value: 'F' }] },
				],
			};

			const visited: string[] = [];
			traverseBreadthFirst({
				root,
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children,
			});

			// BFS visits level by level: A, then B,C, then D,E,F
			expect(visited).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
		});

		it('should attach children to parents', () => {
			const root: TreeNode = {
				value: 'root',
				children: [{ value: 'child1' }, { value: 'child2' }],
			};

			traverseBreadthFirst({
				root,
				expand: (node) => node.children,
				attach: (child, parent) => {
					child.parent = parent;
				},
			});

			expect(root.children?.[0]?.parent).toBe(root);
			expect(root.children?.[1]?.parent).toBe(root);
		});

		it('should filter nodes based on condition', () => {
			const root: TreeNode = {
				value: 'A',
				children: [
					{ value: 'B', children: [{ value: 'D' }] },
					{ value: 'C', children: [{ value: 'E' }] },
				],
			};

			const visited: string[] = [];
			traverseBreadthFirst({
				root,
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children,
				filter: (node) => node.value !== 'C', // Skip 'C' and its children
			});

			// Should visit A, B, D but skip C and E
			expect(visited).toEqual(['A', 'B', 'D']);
		});

		it('should handle single node tree', () => {
			const root: TreeNode = { value: 'single' };
			const visited: string[] = [];

			traverseBreadthFirst({
				root,
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children,
			});

			expect(visited).toEqual(['single']);
		});
	});

	describe('traverseDepthFirst', () => {
		it('should visit nodes in depth-first preorder', () => {
			const root: TreeNode = {
				value: 'A',
				children: [
					{ value: 'B', children: [{ value: 'D' }, { value: 'E' }] },
					{ value: 'C', children: [{ value: 'F' }] },
				],
			};

			const visited: string[] = [];
			traverseDepthFirst({
				root,
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children,
			});

			// DFS preorder: parent before children, deep before wide
			expect(visited).toEqual(['A', 'B', 'D', 'E', 'C', 'F']);
		});

		it('should attach children to parents', () => {
			const root: TreeNode = {
				value: 'root',
				children: [{ value: 'child1' }, { value: 'child2' }],
			};

			traverseDepthFirst({
				root,
				expand: (node) => node.children,
				attach: (child, parent) => {
					child.parent = parent;
				},
			});

			expect(root.children?.[0]?.parent).toBe(root);
			expect(root.children?.[1]?.parent).toBe(root);
		});

		it('should filter nodes based on condition', () => {
			const root: TreeNode = {
				value: 'A',
				children: [
					{ value: 'B', children: [{ value: 'D' }] },
					{ value: 'C', children: [{ value: 'E' }] },
				],
			};

			const visited: string[] = [];
			traverseDepthFirst({
				root,
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children,
				filter: (node) => node.value !== 'C', // Skip 'C' and its children
			});

			// Should visit A, B, D but skip C and E
			expect(visited).toEqual(['A', 'B', 'D']);
		});

		it('should handle single node tree', () => {
			const root: TreeNode = { value: 'single' };
			const visited: string[] = [];

			traverseDepthFirst({
				root,
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children,
			});

			expect(visited).toEqual(['single']);
		});
	});

	describe('collectAncestors', () => {
		it('should collect all ancestors from node to root', () => {
			const grandparent: TreeNode = { value: 'grandparent' };
			const parent: TreeNode = { value: 'parent', parent: grandparent };
			const child: TreeNode = { value: 'child', parent };

			const ancestors = collectAncestors(
				child,
				(node) => node.parent,
				(node) => node.value,
			);

			expect(ancestors).toEqual(['child', 'parent', 'grandparent']);
		});

		it('should handle root node with no parent', () => {
			const root: TreeNode = { value: 'root' };

			const ancestors = collectAncestors(
				root,
				(node) => node.parent,
				(node) => node.value,
			);

			expect(ancestors).toEqual(['root']);
		});

		it('should apply mapper function to each ancestor', () => {
			const node3: TreeNode = { value: 'c' };
			const node2: TreeNode = { value: 'b', parent: node3 };
			const node1: TreeNode = { value: 'a', parent: node2 };

			const ancestors = collectAncestors(
				node1,
				(node) => node.parent,
				(node) => node.value.toUpperCase(), // Transform to uppercase
			);

			expect(ancestors).toEqual(['A', 'B', 'C']);
		});
	});
});
