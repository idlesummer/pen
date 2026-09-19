import type { ErrorComponent } from './route-modules/ErrorBoundary'
import type { DefaultComponent } from './route-modules/DefaultBoundary'
import type { LoadingComponent } from './route-modules/LoadingBoundary'
import type { PageComponent } from './route-modules/PageComponent'
import type { LayoutComponent } from './route-modules/LayoutComponent'

/** One bucket per route module role; every module in a bucket shares that
 *  role's real prop shape. */
export type ComponentMap = {
  page: Record<string, PageComponent>
  layout: Record<string, LayoutComponent>
  loading: Record<string, LoadingComponent>
  error: Record<string, ErrorComponent>
  default: Record<string, DefaultComponent>
}
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
