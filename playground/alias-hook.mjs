// Resolve hook that lets scratch scripts under playground/ import the
// library source directly - mirrors what tsdown does at build time for
// the '@/*' tsconfig path alias and for src's extensionless/`.js` specifiers.
import { existsSync, statSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

const srcRoot = new URL('../src/', import.meta.url)

function withTsExtension(url) {
  const bare = url.replace(/\.js$/, '')
  const barePath = fileURLToPath(bare)

  if (existsSync(barePath))
    return statSync(barePath).isDirectory() ? `${bare}/index.ts` : bare
  return `${bare}.ts`
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/'))
      return nextResolve(withTsExtension(new URL(specifier.slice(2), srcRoot).href), context)

    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts'))
      return nextResolve(withTsExtension(new URL(specifier, context.parentURL).href), context)

    return nextResolve(specifier, context)
  },
})
