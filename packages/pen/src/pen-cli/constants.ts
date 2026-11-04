// commands/build (writes here), commands/start (reads from here) - both
// need to agree on where build output lives
export const OUT_DIR = '.pen/dist'

// commands/build/plugins (writes the build to this filename),
// commands/start (needs the same name to find it afterward)
export const ENTRY_FILE = 'main.js'

/** HMR event sent when route files change. */
export const PEN_ROUTES_CHANGED_EVENT = 'pen:routes-changed'

// The entry-app templates (dev and build) contain these tokens verbatim;
// dev-entry-plugin and build-entry-plugin substitute them when loading
export const APP_DIR_TOKEN = '__PEN_APP_DIR__'
export const INK_OPTIONS_TOKEN = '__PEN_INK_OPTIONS__'
export const STRICT_MODE_TOKEN = '__PEN_STRICT_MODE__'
