// commands/build (writes here), commands/start (reads from here) - both
// need to agree on where build output lives
export const OUT_DIR = '.pen/dist'

// vite/plugins/build-plugin (writes the build to this filename),
// commands/start (needs the same name to find it afterward)
export const ENTRY_FILE = 'main.js'

// vite/plugins/build-plugin, vite/plugins/dev-plugin - both resolve/load
// the same virtual entry module
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
export const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`

// build-plugin, dev-plugin - both substitute these directly into their own
// entry template's source. Each plugin runs its own separate substitution
// pass, so the same token name can be replaced differently in each (e.g.
// raw for build's import.meta.glob base path vs JSON-quoted for dev's own
// appDir const).
export const APP_DIR_TOKEN = '__PEN_APP_DIR__'
export const INK_OPTIONS_TOKEN = '__PEN_INK_OPTIONS__'
// dev-plugin only - entry-app.dev.tsx.txt has no static glob of its own,
// so it needs its first registry's paths handed in from outside
export const INITIAL_PATHS_TOKEN = '__PEN_INITIAL_PATHS__'
