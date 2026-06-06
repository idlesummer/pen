import { buildRouteTree } from '../src/pen/routing/builder.ts'
import { RouteValidationErrors } from '../src/pen/routing/errors.ts'

const appPath = process.argv[2] ?? 'scripts/mock-app'

try {
  const tree = buildRouteTree(appPath)
  console.log(JSON.stringify(tree, null, 2))
} catch (err) {
  if (err instanceof RouteValidationErrors) {
    console.error(err.message)
    process.exitCode = 1
  } else {
    throw err
  }
}
