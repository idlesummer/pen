import type { PageComponent } from '@/pen-react/renderer/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/renderer/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/renderer/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/renderer/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/renderer/components/DefaultBoundary'
import type { ComponentRegistry } from './create-component-registry'

/** Any role's component, once resolved - for checks that don't care which role a path belongs to. */
export type AnyComponent =
  PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** Maps each route module role to its components by file path. Internal to
 *  setup - the renderer never sees path strings or this map, only the
 *  components create-component-matcher.ts's resolveMatch looks up from it. */
export type ComponentMap = {
  page:     Record<string, PageComponent>
  layout:   Record<string, LayoutComponent>
  loading:  Record<string, LoadingComponent>
  error:    Record<string, ErrorComponent>
  default:  Record<string, DefaultComponent>
}

export type BuiltComponentMap = {
  /** Each role's components, kept separate - what create-component-matcher.ts's resolveMatch actually looks up from. */
  componentMap: ComponentMap
  /** Every component merged into one map, regardless of role. */
  allComponents: Record<string, AnyComponent>
  /** Every discovered path, across all roles - the full input createRouter expects. */
  allPaths: string[]
}

/** Assembles an already-cleaned registry into a usable component map,
 *  shared by both the production app-building path and the dev-time diagnostics path.
 *  Each role's entries are already confirmed components - only the role label changes.
 *
 *  @param registry - Each role's cleaned entries, keyed by role.
 *  @returns The role-separated map, a flat merge of every role, and every discovered path. */
export function createComponentMap(registry: ComponentRegistry): BuiltComponentMap {
  const page = registry.page as Record<string, PageComponent>
  const layout = registry.layout as Record<string, LayoutComponent>
  const loading = registry.loading as Record<string, LoadingComponent>
  const error = registry.error as Record<string, ErrorComponent>
  const default_ = registry.default as Record<string, DefaultComponent>

  return {
    componentMap: { page, layout, loading, error, default: default_ },
    allComponents: { ...page, ...layout, ...loading, ...error, ...default_ },
    allPaths: [
      ...Object.keys(page),
      ...Object.keys(layout),
      ...Object.keys(loading),
      ...Object.keys(error),
      ...Object.keys(default_),
    ],
  }
}
