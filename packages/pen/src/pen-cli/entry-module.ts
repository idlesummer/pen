// commands/dev/plugins, commands/build/plugins - both resolve/load the
// same virtual entry module
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
export const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`

// Substituted directly into each command's own entry template - private to
// substituteEntryTemplate below, the only place that needs to know them.
export const APP_DIR_TOKEN = '__PEN_APP_DIR__'
export const INK_OPTIONS_TOKEN = '__PEN_INK_OPTIONS__'

/** A plugin's own `resolveId` hook for the shared virtual entry module. */
export function resolveEntryModuleId(id: string): string | undefined {
  if (id === ENTRY_MODULE_ID)
    return RESOLVED_ENTRY_MODULE_ID
}
