import { PACKAGE_NAME } from '@/lib/constants'
import { GENERATED_HEADER } from './header'

/** Emits the generated `entry.ts`: derives the frozen route list from the
 *  component map's own keys and wires it into a router and an Ink-rendered `App`. */
export function generateEntry(): string {
  return [
    GENERATED_HEADER,
    '',
    'import { createElement } from "react"',
    'import { render } from "ink"',
    `import { App, createRouter } from "${PACKAGE_NAME}"`,
    'import { componentMap } from "./component-map"',
    '',
    'const [match] = createRouter(Object.keys(componentMap))',
    '',
    'export function mount() {',
    '  const element = createElement(App, { match, componentMap })',
    '  return render(element)',
    '}',
    '',
  ].join('\n')
}
