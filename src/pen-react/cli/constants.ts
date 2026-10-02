// Shared between `pen build` (which writes here) and `pen start` (which
// reads from here) - both need to agree on where build output lives.
export const BUILD_OUT_DIR = '.pen/dist'

// Shared between build's plugin (which writes the build to this filename)
// and `pen start` (which needs the same name to find it afterward).
export const BUILD_ENTRY = 'main.js'
