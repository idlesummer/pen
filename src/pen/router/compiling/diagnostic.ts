import type { RouteNode } from './route-tree'

export type CompileDiagnostic = {
  rule: string
  severity: 'error' | 'warning'
  message: string
  files: string[]
}

export function getDiagnosticPath(routeNode: RouteNode): string {
  return Object.values(routeNode.modulePaths)[0] ?? routeNode.path
}
