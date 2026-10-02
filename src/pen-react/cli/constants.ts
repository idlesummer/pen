// Shared between `pen build` (which writes here) and `pen start` (which
// reads from here) - both need to agree on where build output lives.
export const BUILD_OUT_DIR = '.pen/dist'
