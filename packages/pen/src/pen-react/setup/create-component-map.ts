import type { Module, Match, Matcher, Frame, Endpoint, PositionNode } from '@/pen-core'
import type { PageComponent } from '@/pen-react/renderer/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/renderer/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/renderer/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/renderer/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/renderer/components/DefaultBoundary'
import type { ResolvedFrame, ResolvedEndpoint, ResolvedMatch, ResolvedMatcher } from '@/pen-react/renderer/types/resolved-match'

type DefaultExportMap<T> = Record<string, T>

/** Each role's glob'd modules, keyed by path. */
export type RoleModules = {
  page: Record<string, Partial<Module<PageComponent>>>
  layout: Record<string, Partial<Module<LayoutComponent>>>
  loading: Record<string, Partial<Module<LoadingComponent>>>
  error: Record<string, Partial<Module<ErrorComponent>>>
  default: Record<string, Partial<Module<DefaultComponent>>>
}

/** Any role's component, once resolved - for checks that don't care which role a path belongs to. */
export type AnyComponent =
  PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** Maps each route module role to its components by file path. Internal to
 *  setup - the renderer never sees path strings or this map, only the
 *  components resolveMatch looks up from it. */
export type ComponentMap = {
  page:     Record<string, PageComponent>
  layout:   Record<string, LayoutComponent>
  loading:  Record<string, LoadingComponent>
  error:    Record<string, ErrorComponent>
  default:  Record<string, DefaultComponent>
}

export type BuiltComponentMap = {
  /** Each role's components, kept separate - what resolveMatch actually looks up from. */
  componentMap: ComponentMap
  /** Every component merged into one map, regardless of role. */
  allComponents: Record<string, AnyComponent>
  /** Every discovered path, across all roles - the full input createRouter expects. */
  allPaths: string[]
}

/** Maps module paths to their default exports, skipping missing exports.
 *  @param modules - Modules keyed by path.
 *  @returns Default exports keyed by module path. */
function createDefaultExportMap<T>(modules: Record<string, Partial<Module<T>>>): DefaultExportMap<T> {
  const moduleExports: DefaultExportMap<T> = {}
  for (const [path, module] of Object.entries(modules)) {
    const component = module?.default
    if (component)
      moduleExports[path.replace(/^\.\//, '')] = component
  }
  return moduleExports
}

/** Resolves a role-separated set of glob'd modules into one component map,
 *  shared by both the production app-building path and the dev-time diagnostics path.
 *
 *  @param modules - Each role's glob'd modules, keyed by role.
 *  @returns The role-separated map, a flat merge of every role, and every discovered path. */
export function createComponentMap(modules: RoleModules): BuiltComponentMap {
  const page = createDefaultExportMap(modules.page)
  const layout = createDefaultExportMap(modules.layout)
  const loading = createDefaultExportMap(modules.loading)
  const error = createDefaultExportMap(modules.error)
  const default_ = createDefaultExportMap(modules.default)

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

// ── resolution ───────────────────────────────────────────────────────────
// Turns a Match's path strings into the actual components the renderer
// needs, so the renderer itself never has to know a component map exists.

/** Resolves one frame's path references into real components. Assertions are
 *  safe because frames and components come from the same createRouter() call -
 *  a missing component indicates a compiler bug. */
function resolveFrame(frame: Frame<PositionNode>, components: ComponentMap): ResolvedFrame {
  return {
    layout: frame.layout ? components.layout[frame.layout] : undefined,
    loading: frame.loading ? components.loading[frame.loading] : undefined,
    error: frame.error ? components.error[frame.error] : undefined,
    default: frame.default ? components.default[frame.default] : undefined,
    slots: frame.slots ? Object.keys(frame.slots) : undefined,
    paramCount: frame.paramCount,
  }
}

/** Resolves an endpoint's content and frame chain into real components. */
function resolveEndpoint(endpoint: Endpoint<PositionNode>, components: ComponentMap): ResolvedEndpoint {
  return {
    frames: endpoint.frames.map(frame => resolveFrame(frame, components)),
    content: (components.page[endpoint.contentPath] ?? components.default[endpoint.contentPath])!,
    paramCount: endpoint.paramCount,
  }
}

/** Resolves a match's endpoint and every slot's match, recursively. */
function resolveMatch(match: Match, components: ComponentMap): ResolvedMatch {
  const resolved: ResolvedMatch = {
    endpoint: resolveEndpoint(match.endpoint, components),
    params: match.params,
  }
  if (match.slots) {
    resolved.slots = {}
    for (const [name, slotMatch] of Object.entries(match.slots))
      resolved.slots[name] = resolveMatch(slotMatch, components)
  }
  return resolved
}

/** Wraps a matcher so it resolves straight to a renderable match - the
 *  renderer never needs to know a component map exists.
 *
 *  @param matcher - A compiled route matcher, from createRouter.
 *  @param components - The component map to resolve path references against.
 *  @returns A function from pathname straight to a resolved, renderable match. */
export function createResolvedMatcher(matcher: Matcher, components: ComponentMap): ResolvedMatcher {
  return pathname => resolveMatch(matcher(pathname), components)
}
