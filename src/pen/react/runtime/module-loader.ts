import type { ComponentType } from 'react'

type RouteComponent = ComponentType<Record<string, unknown>>

const moduleCache = new Map<string, Promise<RouteComponent>>()

/** Dynamically imports a route module's default export, caching the promise
 *  itself (not just the result) since React's `use()` must resuspend on the
 *  same promise instance across renders instead of starting a fresh import. */
export function loadModule(path: string): Promise<RouteComponent> {
  let modulePromise = moduleCache.get(path)
  if (!modulePromise) {
    modulePromise = import(/* @vite-ignore */ path).then(routeModule => routeModule.default)
    moduleCache.set(path, modulePromise)
  }
  return modulePromise
}
