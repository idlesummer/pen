import { createContext } from 'react'

/**
 * Holds the dynamic route params extracted from the current URL.
 * e.g. navigating to "/users/42/" with route "/users/:id/" gives { id: "42" }
 */
export const ParamsContext = createContext<Record<string, string>>({})
