import { describe, it, expect } from 'vitest'
import { traverse, ancestors } from '../tree'

// Test tree structure
type TreeNode = {
	value: string
	children?: TreeNode[]
	parent?: TreeNode
}

describe('tree', () => {
	describe('traverse', () => {
		it('should visit nodes in depth-first preorder', () => {
			const root: TreeNode = {
				value: 'A',
				children: [
					{ value: 'B', children: [{ value: 'D' }, { value: 'E' }] },
					{ value: 'C', children: [{ value: 'F' }] },
				],
			}

			const visited: string[] = []
			traverse(root, {
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children ?? [],
			})

			// DFS preorder: parent before children, deep before wide
			expect(visited).toEqual(['A', 'B', 'D', 'E', 'C', 'F'])
		})

		it('should attach children to parents during traversal', () => {
			const root: TreeNode = {
				value: 'root',
				children: [{ value: 'child1' }, { value: 'child2' }],
			}

			traverse(root, {
				expand: (node) => node.children ?? [],
				attach: (child, parent) => {
					child.parent = parent
				},
			})

			expect(root.children?.[0]?.parent).toBe(root)
			expect(root.children?.[1]?.parent).toBe(root)
		})

		it('should handle single node tree', () => {
			const root: TreeNode = { value: 'single' }
			const visited: string[] = []

			traverse(root, {
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children ?? [],
			})

			expect(visited).toEqual(['single'])
		})

		it('should handle tree with no expand callback', () => {
			const root: TreeNode = {
				value: 'root',
				children: [{ value: 'child' }],
			}

			const visited: string[] = []
			traverse(root, {
				visit: (node) => visited.push(node.value),
			})

			// Without expand, only visits root
			expect(visited).toEqual(['root'])
		})

		it('should process children in correct order', () => {
			const root: TreeNode = {
				value: 'A',
				children: [
					{ value: 'B' },
					{ value: 'C' },
					{ value: 'D' },
				],
			}

			const visited: string[] = []
			traverse(root, {
				visit: (node) => visited.push(node.value),
				expand: (node) => node.children ?? [],
			})

			expect(visited).toEqual(['A', 'B', 'C', 'D'])
		})
	})

	describe('ancestors', () => {
		it('should collect all ancestors from node to root', () => {
			const grandparent: TreeNode = { value: 'grandparent' }
			const parent: TreeNode = { value: 'parent', parent: grandparent }
			const child: TreeNode = { value: 'child', parent }

			const ancestorValues: string[] = []
			ancestors(child, {
				visit: (node) => ancestorValues.push(node.value),
				parent: (node) => node.parent,
			})

			expect(ancestorValues).toEqual(['child', 'parent', 'grandparent'])
		})

		it('should handle root node with no parent', () => {
			const root: TreeNode = { value: 'root' }

			const ancestorValues: string[] = []
			ancestors(root, {
				visit: (node) => ancestorValues.push(node.value),
				parent: (node) => node.parent,
			})

			expect(ancestorValues).toEqual(['root'])
		})

		it('should stop when parent callback returns undefined', () => {
			const node2: TreeNode = { value: 'node2' }
			const node1: TreeNode = { value: 'node1', parent: node2 }

			const ancestorValues: string[] = []
			ancestors(node1, {
				visit: (node) => ancestorValues.push(node.value),
				parent: (node) => node.parent,
			})

			expect(ancestorValues).toEqual(['node1', 'node2'])
		})

		it('should visit each node exactly once', () => {
			const node3: TreeNode = { value: 'c' }
			const node2: TreeNode = { value: 'b', parent: node3 }
			const node1: TreeNode = { value: 'a', parent: node2 }

			let visitCount = 0
			ancestors(node1, {
				visit: () => visitCount++,
				parent: (node) => node.parent,
			})

			expect(visitCount).toBe(3)
		})
	})
})
