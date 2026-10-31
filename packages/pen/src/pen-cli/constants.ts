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

// build-plugin only - entry-app.build.tsx.txt's import.meta.glob calls need
// a literal base path, so these get substituted directly into its source
export const APP_DIR_TOKEN = '__PEN_APP_DIR__'
export const INK_OPTIONS_TOKEN = '__PEN_INK_OPTIONS__'

// dev-plugin only - a second virtual module supplying appDir/inkOptions/
// initialPaths as real exports, so the dev entry template's own source
// never needs rewriting (unlike build, nothing in it requires a literal)
export const RUNTIME_CONFIG_MODULE_ID = 'virtual:pen/runtime-config'
export const RESOLVED_RUNTIME_CONFIG_MODULE_ID = `\0${RUNTIME_CONFIG_MODULE_ID}`
