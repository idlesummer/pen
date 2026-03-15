/** Navigation entry with URL and optional searchParams */
type Location = {
  url: string
  searchParams?: unknown
}

type NavigationState = {
  position: number
  history: Location[]
}

type NavigationAction =
  | { type: 'push'; url: string; searchParams?: unknown }
  | { type: 'replace'; url: string }
  | { type: 'back' }
  | { type: 'forward' }

export function reducer(navigation: NavigationState, action: NavigationAction): NavigationState {
  const { history, position } = navigation

  switch (action.type) {
    case 'push': {
      const { url, searchParams } = action
      const location = { url: normalizeUrl(url), searchParams }
      return {
        position: position+1,
        history: history.toSpliced(position+1, Infinity, location),
      }
    }
    case 'replace': return {
      ...navigation,
      history: history.with(position, { url: normalizeUrl(action.url) }),
    }
    case 'back': return position > 0
      ? { ...navigation, position: position-1 }
      : navigation

    case 'forward': return position < history.length-1
      ? { ...navigation, position: position+1 }
      : navigation
  }
}

export function createNavigationState(initialUrl: string): NavigationState {
  const history = [{ url: normalizeUrl(initialUrl) }]
  return { history, position: 0 }
}

/** Normalizes a URL to include a trailing slash. */
function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}
