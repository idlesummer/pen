export const APP_DIR = 'src/app'

// Shared between `pen build` (which writes here) and `pen start` (which
// reads from here) - both need to agree on where build output lives.
export const OUT_DIR = '.pen/dist'

// Shared between build's plugin (which writes the build to this filename)
// and `pen start` (which needs the same name to find it afterward).
export const ENTRY_FILE = 'main.js'
