// examples/basic-app/src/index.tsx
import { buildFileTree, buildSegmentTree, buildRouteManifest } from '../../../dist/build/index'

const fileTree = buildFileTree('./src/app')
const routeTree = buildSegmentTree(fileTree)
const manifest = routeTree && buildRouteManifest(routeTree)

console.log(manifest)
