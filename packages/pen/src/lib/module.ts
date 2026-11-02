import { glob } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/** The shape of an ES module namespace object. */
export type ModuleNamespace = Record<string, unknown>

/** The shape of an ES module namespace object that has a default export. */
export type ModuleNamespaceWithDefault<T = unknown> = ModuleNamespace & {
  default: T
}

/** Loads a module from the given file path. */
export type ModuleLoader = (path: string) => Promise<ModuleNamespace>

/** Checks whether a value is a non-null record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Checks that a value is a module with a default export.
 *  @param value - The value to check, typically a glob'd or dynamically imported entry.
 *  @returns Whether the value is a module with a `default` property. */
function hasDefaultExport(value: unknown): value is ModuleNamespaceWithDefault {
  return isRecord(value) && 'default' in value
}

/** Checks whether a value is a module with a function default export.
 *  @param value - The value to check.
 *  @returns Whether the value is a module with a function default export. */
export function hasFunctionDefaultExport<T>(value: unknown): value is ModuleNamespaceWithDefault<T> {
  return hasDefaultExport(value) && typeof value.default === 'function'
}

/** Loads a module from the given file path. */
function importModule(path: string): Promise<ModuleNamespace> {
  return import(pathToFileURL(path).href)
}

/** Discovers and loads modules matching a glob pattern.
 * @param cwd - Directory to search within.
 * @param pattern - Glob pattern used to discover modules.
 * @param moduleLoader - Function used to import each discovered module.
 */
export async function globModules(cwd: string, pattern: string, moduleLoader: ModuleLoader=importModule): Promise<Record<string, ModuleNamespace>> {
  const paths = (await Array.fromAsync(glob(pattern, { cwd }))).sort()
  const entriesPromises = paths.map(async path => [path, await moduleLoader(join(cwd, path))] as const)
  const entries = await Promise.all(entriesPromises)
  return Object.fromEntries(entries)
}
