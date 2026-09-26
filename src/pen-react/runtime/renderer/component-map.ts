import type { ErrorComponent } from './components/ErrorBoundary'
import type { DefaultComponent } from './components/DefaultBoundary'
import type { LoadingComponent } from './components/LoadingBoundary'
import type { PageComponent } from './components/PageComponent'
import type { LayoutComponent } from './components/LayoutComponent'

/** One bucket per route module role; every module in a bucket shares that
 *  role's real prop shape. */
export type ComponentMap = {
  page: Record<string, PageComponent>
  layout: Record<string, LayoutComponent>
  loading: Record<string, LoadingComponent>
  error: Record<string, ErrorComponent>
  default: Record<string, DefaultComponent>
}

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** The shape of a route module file - only its default export matters. */
export type RouteModule = { default: RouteComponent }

type ComponentRole = keyof ComponentMap
type ComponentFor<Role extends ComponentRole> = ComponentMap[Role][string]

/**
 * Resolves a route module component by role and path.
 * The role determines the component's prop type.
 *
 * @param role The route module role.
 * @param path The module path.
 * @param components The registered route module components.
 * @returns The component registered for the given role and path.
 * @throws If no component is registered for the given role and path.
 */
export function resolveComponent<Role extends ComponentRole>(role: Role, path: string, components: ComponentMap): ComponentFor<Role> {
  const Component = components[role][path] as ComponentFor<Role> | undefined
  if (!Component)
    throw new Error(`No ${role} component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}

/**
  * Resolves the component for endpoint content, which may be either a page
  * or a default module.
  *
  * @param path The module path.
  * @param components The registered route module components.
  * @returns The page or default component registered at the given path.
  * @throws If no page or default component is registered for the given path.
  */
export function resolveContent(path: string, components: ComponentMap): PageComponent | DefaultComponent {
  const Component = components.page[path] ?? components.default[path]
  if (!Component)
    throw new Error(`No page or default component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}
