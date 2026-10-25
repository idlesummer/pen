// Framework-internal exports - for pen's own generated/bundled code

export type { Module } from '@/lib/module'
export type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from './pen-react/render'

export { PenApp, createMatcherStore, updateMatcherStore, ROUTES_CHANGED_EVENT } from './pen-react/app'
export type { ComponentMatcherStore } from './pen-react/app'
