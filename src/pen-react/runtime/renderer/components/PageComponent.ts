import type { FunctionComponent, ReactNode } from 'react'
import type { ParamTable } from '../param-table'

type PageProps = { params: ParamTable }

/** An async page called outside React, with its result unwrapped by pen. */
export type AsyncPageComponent = (props: PageProps) => Promise<ReactNode>

/** A page component. */
export type PageComponent = FunctionComponent<PageProps>

/** Checks whether a component is declared with `async`. Takes any
 *  component-shaped function, not just a page, since module validation
 *  checks entries from a map spanning every role. The `never` param is
 *  deliberate: it accepts any role's props structurally, so this file
 *  never has to import the role union to type-check - importing it
 *  previously created a circular dependency with component-map.ts. */
export function isAsyncComponent(Content: (props: never) => ReactNode | Promise<ReactNode>): Content is AsyncPageComponent {
  return Content.constructor.name === 'AsyncFunction'
}
