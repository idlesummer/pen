import { createBuilder } from 'vite'
import { findProjectRoot } from '@/lib/find-project-root'
import { pen } from '@/pen-react/plugin'

/** Bundles the app with Vite, using a default config equivalent to what a
 *  user's own vite.config.ts would need if they added the plugin
 *  themselves. Vite creates both client and SSR environments, so explicitly
 *  build only the server one - the plugin's own applyToEnvironment gate
 *  protects a user's own `vite build` the same way, since that call builds
 *  every environment by default.
 *
 *  root is found explicitly (rather than left to Vite's default, which is
 *  just process.cwd()) so `pen build` works from any subdirectory of the
 *  project, the same way git/npm do - appDir and outDir both resolve
 *  against it.
 *
 *  Reports through Vite's own logger (the plugin's buildStart hook), so a
 *  failure here has already been printed by the time this throws.
 *
 *  @param appDir Path to the app's route directory, relative to the project root.
 *  @param outDir Directory to write the bundle to. */
export async function buildApp(appDir: string, outDir: string): Promise<void> {
  const builder = await createBuilder({
    root: findProjectRoot(process.cwd()),
    configFile: false,
    plugins: [pen(appDir)],
    build: { outDir },
  })
  await builder.build(builder.environments.ssr!)
}
