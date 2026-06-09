import { Route, validate, UrlNode, FileRouterError, RouteValidationErrors } from '../src/pen/routing'

try {
  const appPath = 'scripts/mock-app'
  const root = Route.read(appPath)
  const tree = UrlNode.project(root)
  console.log(JSON.stringify(tree, null, 2))

  // Report findings without throwing, so the tree is always inspectable.
  const errors = validate(root)
  if (errors.length) {
    console.error('\n' + new RouteValidationErrors(errors).message)
    process.exitCode = 1
  }
}
catch (err) {
  if (err instanceof FileRouterError) {
    console.error(err.message)
    process.exitCode = 1
  } else {
    throw err
  }
}
