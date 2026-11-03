# @idlesummer/pen

A React framework for building terminal UIs (TUIs), with file-based routing modeled on Next.js's App Router.

## Quick start

```bash
npx pen create my-app
cd my-app
npm install
npx pen dev
```

## What it looks like

```
pen v0.3.1

✓ ready in 81ms

Routes:
  /
  ├─ home/
  │  ├─ @sidebar/
  │  │  ├─ default
  │  │  └─ page
  │  ├─ [id]/
  │  │  └─ page
  │  ├─ about/
  │  │  └─ page
  │  ├─ layout
  │  └─ page
  ├─ layout
  ├─ default
  └─ page

╭──────────────────────────────────────────╮
│ Current path: /                           │
╰──────────────────────────────────────────╯
╭──────────────────────────────────────────╮
│                                            │
│         Hello World from RootPage         │
│                                            │
╰──────────────────────────────────────────╯
```

Edit a route file and the terminal updates in place via Fast Refresh - no restart, no re-render flash.

<!--
Consider swapping this code block for an actual terminal recording (asciinema,
vhs, or a GIF) once the README is otherwise settled - it's a stronger first
impression than a static block, but not worth blocking the draft on.
-->

## Core concepts

### File-based routing

Routes live under `src/app/`, following the same file conventions as Next.js's App Router:

| File | Purpose |
|---|---|
| `page.tsx` | The route's content. A folder with a `page.tsx` is a navigable route. |
| `layout.tsx` | Wraps the route and everything nested under it. |
| `loading.tsx` | Shown while the route's data/components are loading. |
| `error.tsx` | Shown if the route throws during render. |
| `default.tsx` | Fallback content for a parallel route slot. |
| `[id]/` | Dynamic segment - matches any single path segment. |
| `[...ids]/` | Catch-all segment - matches one or more path segments. |
| `@slotName/` | A named parallel route, rendered alongside its parent. |

`pen dev` discovers these on startup and on every file change, and prints the resulting route tree so you can see exactly what got registered.

## CLI reference

| Command | Description |
|---|---|
| `pen create [name]` | Scaffold a new pen project. Omit `name` to scaffold into the current directory. |
| `pen dev` | Start the pen development server, with Fast Refresh and route hot-reloading. |
| `pen build` | Compile routes and bundle the app with Vite, for production. |
| `pen start` | Run the app built by `pen build`. |

## Configuration

Create a `pen.config.ts` at your project root:

```ts
import { defineConfig } from '@idlesummer/pen'

export default defineConfig({
  // Run React Compiler over your components. Experimental, off by default -
  // see oxc-transform-react's own README before enabling it.
  reactCompiler: false,

  // Forwarded directly to Ink's own render() call.
  ink: {
    maxFps: 75,
  },

  // Dev server file-watching.
  watch: {
    // Use polling instead of native filesystem events. Defaults to true on
    // Windows, where native events can stop detecting changes after a
    // directory is deleted - also worth enabling on Docker or
    // network-mounted volumes.
    usePolling: false,
  },
})
```

## Why pen

<!--
PLACEHOLDER - fill this in yourself. What problem does this solve, why did
you build it instead of using something else, and what makes it worth using
over doing the same thing by hand? This is the one section nobody else can
write for you.
-->

## Requirements

- Node.js >= 26
- React ^19.2.8
- Ink ^7.1.1

## License

MIT
