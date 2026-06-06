import { buildRouteTree } from '../src/pen/routing/builder.ts'
import { RouteValidationErrors, type FileRouterError } from '../src/pen/routing/errors.ts'

type Case = {
  name: string
  dir: string
  /** Expected error class names (order-independent). */
  expect: string[]
}

const cases: Case[] = [
  {
    name: 'cross-group collision -> one relational error',
    dir: 'scripts/fixtures/cross-group-collision',
    expect: ['DuplicateScreenError'],
  },
  {
    name: 'sibling [id] + [slug] -> intrinsic only, reported once',
    dir: 'scripts/fixtures/dynamic-conflict',
    expect: ['ConflictingDynamicSegmentsError'],
  },
  {
    name: 'unbalanced [id -> one malformed error, children pruned',
    dir: 'scripts/fixtures/unbalanced-malformed',
    expect: ['MalformedSegmentError'],
  },
  {
    name: 'malformed branch + collision branch -> both reported',
    dir: 'scripts/fixtures/malformed-and-collision',
    expect: ['MalformedSegmentError', 'DuplicateScreenError'],
  },
  {
    name: 'catch-all not terminal -> intrinsic',
    dir: 'scripts/fixtures/catchall-not-terminal',
    expect: ['CatchallNotTerminalError'],
  },
  {
    name: 'clean app -> no errors, returns tree',
    dir: 'scripts/fixtures/clean',
    expect: [],
  },
]

function collect(dir: string): FileRouterError[] {
  try {
    buildRouteTree(dir)
    return []
  } catch (err) {
    if (err instanceof RouteValidationErrors) return err.errors
    throw err
  }
}

function sorted(names: string[]): string {
  return [...names].sort().join(', ') || '(none)'
}

let failed = 0

for (const { name, dir, expect } of cases) {
  const errors = collect(dir)
  const actual = errors.map(e => e.name)
  const ok = sorted(actual) === sorted(expect)

  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) {
    failed++
    console.log(`        expected: ${sorted(expect)}`)
    console.log(`        actual:   ${sorted(actual)}`)
    for (const e of errors)
      console.log(`        - ${e.message.split('\n')[0]}`)
  }
}

console.log(`\n${failed ? `${failed} case(s) failed` : 'All cases passed'}`)
process.exitCode = failed ? 1 : 0
