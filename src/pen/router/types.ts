/** Navigation entry with URL and optional data */
export interface NavigationEntry {
  url: string
  data?: unknown
}

/** Internal navigation history state */
export interface NavigationHistory {
  stack: NavigationEntry[]
  position: number
}
