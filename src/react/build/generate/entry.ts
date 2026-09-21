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
    `import { App, createRouter } from "${PACKAGE_NAME}/internal"`,
    'import { componentMap } from "./component-map"',
    '',
    '// Each role bucket\'s own keys are the module paths - componentMap\'s',
    '// own top-level keys are just the role names (page, layout, ...).',
    'const modulePaths = Object.values(componentMap).flatMap(Object.keys)',
    'const { matcher } = createRouter(modulePaths)',
    '',
    'export function mount() {',
    '  const element = createElement(App, { matcher, componentMap })',
    '  return render(element)',
    '}',
    '',
  ].join('\n')
}
