import type { ErrorComponent } from '../module-components/ErrorBoundary'
import type { DefaultComponent } from '../module-components/DefaultBoundary'
import type { LoadingComponent } from '../module-components/LoadingBoundary'
import type { PageComponent } from '../module-components/PageComponent'
import type { LayoutComponent } from '../module-components/LayoutComponent'

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

/** Looks up a component by role and path - role determines the return type,
 *  no assertion needed. */
export function resolveComponent<Role extends ComponentRole>(role: Role, path: string, components: ComponentMap): ComponentFor<Role> {
  const Component = components[role][path] as ComponentFor<Role> | undefined
  if (!Component)
    throw new Error(`No ${role} component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}

/** endpoint.content can be a page or the fallback default, decided at match
 *  time, so this checks both buckets. */
export function resolveContent(path: string, componentMap: ComponentMap): PageComponent | DefaultComponent {
  const Component = componentMap.page[path] ?? componentMap.default[path]
  if (!Component)
    throw new Error(`No page or default component registered for route module "${path}". Regenerate the route builder output.`)
  return Component
}
