import type { RenderOptions as InkRenderOptions } from 'ink'
import { stripRegion } from '@/lib/strip-regions'

// commands/dev/plugins, commands/build/plugins - both resolve/load the
// same virtual entry module
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
export const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`

// Substituted directly into each command's own entry template - private to
// substituteEntryTemplate below, the only place that needs to know them.
const APP_DIR_TOKEN = '__PEN_APP_DIR__'
const INK_OPTIONS_TOKEN = '__PEN_INK_OPTIONS__'

/** A plugin's own `resolveId` hook for the shared virtual entry module. */
export function resolveEntryModuleId(id: string): string | undefined {
  if (id === ENTRY_MODULE_ID)
    return RESOLVED_ENTRY_MODULE_ID
}

/** Strips the codegen region from an entry template and substitutes the
 *  app directory and Ink options into it.
 *
 *  @param quoteAppDir - true to substitute `appDir` as a JSON-quoted JS
 *  string (dev, into a variable declaration); false to substitute it raw
 *  (build, into an `import.meta.glob` base path). */
export function substituteEntryTemplate(template: string, appDir: string, ink: InkRenderOptions | undefined, quoteAppDir: boolean): string {
  return stripRegion(template, 'codegen')
    .replaceAll(APP_DIR_TOKEN, quoteAppDir ? JSON.stringify(appDir) : appDir)
    .replaceAll(INK_OPTIONS_TOKEN, JSON.stringify(ink))
}
