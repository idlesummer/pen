import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { createClaims, addClaims } from '../compiler/position/position-claims'
import { validateRouteTree, validateConflicts } from '../compiler/validate'

describe('validateRouteTree', () => {
  test('flags a malformed segment', () => {
    const tree = createRouteTree(['[bad name]/page.tsx'])
    const diagnostics = validateRouteTree(tree)
    expect(diagnostics.some(d => d.rule === 'malformed-segment')).toBe(true)
  })

  test('warns on a catch-all route that has nested children', () => {
    const tree = createRouteTree(['[...slug]/page.tsx', '[...slug]/nested/page.tsx'])
    const diagnostics = validateRouteTree(tree)
    const diagnostic = diagnostics.find(d => d.rule === 'non-terminal-catchall')
    expect(diagnostic?.severity).toBe('warn')
  })

  test('flags a slot nested inside another slot', () => {
    const tree = createRouteTree(['@modal/@inner/page.tsx'])
    const diagnostics = validateRouteTree(tree)
    expect(diagnostics.some(d => d.rule === 'nested-slot')).toBe(true)
  })

  test('flags a repeated dynamic param name along the same path', () => {
    const tree = createRouteTree(['[id]/[id]/page.tsx'])
    const diagnostics = validateRouteTree(tree)
    expect(diagnostics.some(d => d.rule === 'repeated-param-name')).toBe(true)
  })

  test('flags a slot whose parent has no layout.tsx', () => {
    const tree = createRouteTree(['@modal/page.tsx', 'page.tsx'])
    const diagnostics = validateRouteTree(tree)
    expect(diagnostics.some(d => d.rule === 'slot-without-layout')).toBe(true)
  })

  test('a slot whose parent has a layout.tsx is not flagged', () => {
    const tree = createRouteTree(['@modal/page.tsx', 'layout.tsx', 'page.tsx'])
    const diagnostics = validateRouteTree(tree)
    expect(diagnostics.some(d => d.rule === 'slot-without-layout')).toBe(false)
  })

  test('a clean tree produces no diagnostics', () => {
    const tree = createRouteTree(['page.tsx', 'blog/page.tsx'])
    expect(validateRouteTree(tree)).toEqual([])
  })
})

describe('validateConflicts', () => {
  test('flags multiple pages claiming the same position', () => {
    const treeA = createRouteTree(['(a)/page.tsx'])
    const treeB = createRouteTree(['(b)/page.tsx'])
    const claims = createClaims()
    addClaims(claims, treeA.children[0]!)
    addClaims(claims, treeB.children[0]!)
    expect(validateConflicts([claims]).some(d => d.rule === 'duplicate-page-route')).toBe(true)
  })

  test('flags multiple distinct fallback owners claiming the same position', () => {
    const treeA = createRouteTree(['(a)/fallback.tsx'])
    const treeB = createRouteTree(['(b)/fallback.tsx'])
    const claims = createClaims()
    addClaims(claims, treeA.children[0]!)
    addClaims(claims, treeB.children[0]!)
    expect(validateConflicts([claims]).some(d => d.rule === 'duplicate-fallback-route')).toBe(true)
  })

  test('flags multiple catch-all routes claiming the same position', () => {
    const treeA = createRouteTree(['(a)/[...x]/page.tsx'])
    const treeB = createRouteTree(['(b)/[...y]/page.tsx'])
    const claims = createClaims()
    addClaims(claims, treeA.children[0]!.children[0]!)
    addClaims(claims, treeB.children[0]!.children[0]!)
    expect(validateConflicts([claims]).some(d => d.rule === 'duplicate-catchall-route')).toBe(true)
  })

  test('flags two dynamic routes at the same position disagreeing on the param name', () => {
    const treeA = createRouteTree(['(a)/[id]/page.tsx'])
    const treeB = createRouteTree(['(b)/[slug]/page.tsx'])
    const claims = createClaims()
    addClaims(claims, treeA.children[0]!.children[0]!)
    addClaims(claims, treeB.children[0]!.children[0]!)
    expect(validateConflicts([claims]).some(d => d.rule === 'param-name-clash')).toBe(true)
  })

  test('a single claim per category produces no conflicts', () => {
    const tree = createRouteTree(['page.tsx'])
    const claims = createClaims()
    addClaims(claims, tree)
    expect(validateConflicts([claims])).toEqual([])
  })
})
