import { GENERATED_HEADER } from '../generated-header'

/** Emits the generated `entry.ts`: wires the frozen route files and
 *  component map into a router and an Ink-rendered `App`. */
export function generateEntry(): string {
  return [
    GENERATED_HEADER,
    '',
    'import { createElement } from "react"',
    'import { render } from "ink"',
    'import { App, createRouter } from "@idlesummer/pen"',
    'import { componentMap } from "./component-map"',
    'import { modulePaths } from "./module-paths"',
    '',
    'const [match] = createRouter(modulePaths)',
    '',
    'export function mount() {',
    '  const element = createElement(App, { match, componentMap })',
    '  return render(element)',
    '}',
    '',
  ].join('\n')
}
