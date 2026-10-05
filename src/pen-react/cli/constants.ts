// commands/build, commands/dev - both default to this app directory
export const APP_DIR = 'src/app'

// commands/build (writes here), commands/start (reads from here) - both
// need to agree on where build output lives
export const OUT_DIR = '.pen/dist'

// vite/plugins/build-plugin (writes the build to this filename),
// commands/start (needs the same name to find it afterward)
export const ENTRY_FILE = 'main.js'

// vite/plugins/build-plugin, vite/plugins/dev-plugin - both resolve/load
// the same virtual entry module and substitute the same token into its source
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
export const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
export const APP_DIR_TOKEN = '__PEN_APP_DIR__'
