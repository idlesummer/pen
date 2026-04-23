import { buildRouteTree } from '../src/pen/routing/builder.ts'

const tree = buildRouteTree('scripts/mock-app')
console.log(JSON.stringify(tree, null, 2))
