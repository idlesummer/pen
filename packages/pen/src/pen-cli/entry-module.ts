// commands/dev/plugins, commands/build/plugins - both resolve/load the
// same virtual entry module
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
export const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`

// Each command's own entry plugin substitutes these directly into its own
// entry template's source. Each plugin runs its own separate substitution
// pass, so the same token name can be replaced differently in each (e.g.
// raw for build's import.meta.glob base path vs JSON-quoted for dev's own
// appDir const).
export const APP_DIR_TOKEN = '__PEN_APP_DIR__'
export const INK_OPTIONS_TOKEN = '__PEN_INK_OPTIONS__'
