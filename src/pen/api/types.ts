/** Navigation entry with URL and optional data */
export type NavigationEntry = {
  url: string
  data?: unknown
}

/** Internal navigation history state */
export type NavigationHistory = {
  stack: NavigationEntry[]
  position: number
}
