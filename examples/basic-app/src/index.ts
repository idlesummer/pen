// examples/basic-app/src/index.tsx
import { buildFileTree, buildRouteTree, buildRouteManifest } from '../../../dist/build/index'

const fileTree = buildFileTree('./src/app')
const routeTree = buildRouteTree(fileTree)
const manifest = routeTree && buildRouteManifest(routeTree)

console.log(manifest)
