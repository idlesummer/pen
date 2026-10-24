// Framework-internal exports - for pen's own generated/bundled code

export type { Module } from '@/lib/module'
export type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from './pen-react/render'

export { PenApp } from './pen-react/render'
export { createComponentMatcher, ROUTES_CHANGED_EVENT } from './pen-react/setup'
