import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './renderer/component-map'
import { usePathname } from './navigation/hooks/use-pathname'
import { renderPlan } from './renderer/render'

type RouterProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Re-matches the route on every navigation and renders the resulting
 *  plan - always something, since the root's guaranteed default (real or
 *  built-in) ensures every URL resolves to at least that. */
export function Router({ matcher, componentMap }: RouterProps) {
  const pathname = usePathname()
  const plan = matcher(pathname)
  return renderPlan(plan, componentMap)
}
