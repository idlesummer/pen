// commands/build (writes here), commands/start (reads from here) - both
// need to agree on where build output lives
export const OUT_DIR = '.pen/dist'

// commands/build/plugins (writes the build to this filename),
// commands/start (needs the same name to find it afterward)
export const ENTRY_FILE = 'main.js'

/** HMR event sent when route files change. */
export const PEN_ROUTES_CHANGED_EVENT = 'pen:routes-changed'
