import { PACKAGE_NAME } from '@/lib/constants'
import { GENERATED_HEADER } from './header'

/** @deprecated Generates `const [matcher] = createRouter(...)` - the new
 *  createRouter() returns { matcher, modulePaths, diagnostics }, not a
 *  tuple, so the emitted code destructures wrong. Also wires into App/Router,
 *  which are themselves deprecated - needs a rewrite against the new pipeline. */
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
    'const [matcher] = createRouter(Object.keys(componentMap))',
    '',
    'export function mount() {',
    '  const element = createElement(App, { matcher, componentMap })',
    '  return render(element)',
    '}',
    '',
  ].join('\n')
}
