# @idlesummer/pen

File-based routing framework for React Ink terminal applications (inspired by Next.js).

> **Heads up:** This is a personal learning project and my first attempt at building a routing framework. The API will change, there are bugs, and I'm figuring things out as I go. Use it for experiments and side projects, but probably not in production.

## What is this?

Pen brings Next.js-style file-based routing to terminal applications built with [Ink](https://github.com/vadimdemedes/ink). Instead of manually wiring up routes and navigation, just organize your files in a specific structure and the routing happens automatically.

```
src/app/
├── layout.tsx           → Root layout for all routes
├── screen.tsx           → Home route (/)
├── about/
│   └── screen.tsx       → About page (/about)
└── settings/
    ├── layout.tsx       → Settings layout
    ├── screen.tsx       → Settings home (/settings)
    └── profile/
        └── screen.tsx   → Profile page (/settings/profile)
```

That's it. No router config, no manual route definitions. The directory structure **is** your routing table.

## Why?

I wanted to build something complex enough to learn from but small enough to actually finish. Terminal apps need navigation too, and doing it manually gets tedious fast. This scratches both itches.

Also, Ink is awesome and deserves better tooling.

## Features

- **File-based routing** - Organize files, get routes for free
- **Nested layouts** - Wrap child routes with parent layouts automatically
- **Error boundaries** - Catch errors at any level of your route tree
- **Not-found handling** - Custom 404 screens per route
- **Type-safe navigation** - Full TypeScript support throughout
- **Simple CLI** - Three commands: `init`, `build`, `start`

## What's missing?

A lot, honestly:

- No dev mode or watch mode (you have to rebuild manually)
- No dynamic routes like `/users/[id]`
- No loading states
- No route middleware
- No lazy loading
- Not optimized for large apps

I'll get to these eventually. Or maybe you will! PRs welcome.

## Installation

```bash
npm install github:idlesummer/pen
```

Once published to npm, it'll be:
```bash
npm install @idlesummer/pen
```

## Quick Start

### 1. Initialize your project

```bash
npx pen init
```

This creates a basic file structure:
```
src/app/
├── layout.tsx
└── screen.tsx
```

### 2. Create some routes

```bash
mkdir src/app/about
echo "export default () => 'About page'" > src/app/about/screen.tsx
```

### 3. Build and run

```bash
npx pen build
npx pen start
```

Your app starts at the initial route defined in your entry point.

## File Conventions

### `screen.tsx` (required)

The actual content for a route. Every route needs one.

```tsx
export default function HomeScreen() {
  return <Text>Welcome home</Text>;
}
```

### `layout.tsx` (optional)

Wraps child routes. Layouts inherit from parent to child.

```tsx
import { Box, Text } from 'ink';

export default function SettingsLayout({ children }) {
  return (
    <Box flexDirection="column">
      <Text bold>Settings</Text>
      {children}
    </Box>
  );
}
```

### `error.tsx` (optional)

Error boundary fallback for this route and its children.

```tsx
export default function SettingsError({ error, reset }) {
  return (
    <Box>
      <Text color="red">Something broke: {error.message}</Text>
      <Text dimColor>Press R to reset</Text>
    </Box>
  );
}
```

### `not-found.tsx` (optional)

Custom 404 screen when a child route doesn't exist.

```tsx
export default function NotFound({ url }) {
  return <Text>Route not found: {url}</Text>;
}
```

### Special Folders

- `_private/` - Ignored by the router (for utilities, shared components, etc.)
- `(group)/` - Groups routes without adding a URL segment

## Navigation

Use the provided hooks to navigate around your app:

```tsx
import { useNavigate, useUrl, useHistory } from '@idlesummer/pen';

function MyComponent() {
  const navigate = useNavigate();
  const url = useUrl();
  const { back, forward, position, history } = useHistory();

  return (
    <Box>
      <Text>Current URL: {url}</Text>
      <Text onPress={() => navigate('/about')}>Go to About</Text>
      <Text onPress={() => back()}>Go back</Text>
    </Box>
  );
}
```

Available hooks:
- `useNavigate()` - Returns `push`, `replace` functions
- `useUrl()` - Current URL string
- `useHistory()` - History stack and navigation
- `useRouteData()` - Data passed during navigation
- `useRouter()` - Full router context (all of the above)

## CLI Commands

### `pen init`

Creates initial app structure and config file.

```bash
npx pen init
```

### `pen build`

Scans your `src/app` directory, generates routing code, and bundles everything.

```bash
npx pen build
```

### `pen start [url]`

Runs your compiled app. Optionally pass an initial URL.

```bash
npx pen start
npx pen start /settings/profile
```

## Configuration

Create a `pen.config.ts` file in your project root:

```typescript
import { defineConfig } from '@idlesummer/pen';

export default defineConfig({
  appDir: './src/app',  // Where your routes live
  outDir: './.pen',     // Build output directory
});
```

## How It Works

The build process has three phases:

1. **Scan** - Walks your `src/app` directory and builds a file tree
2. **Generate** - Creates TypeScript files with route manifests and component imports
3. **Compile** - Bundles everything with Rolldown into a single executable

At runtime, the router:
- Matches URLs in O(1) time using a flat manifest
- Composes route trees from inside-out (screen → layout → layout...)
- Manages navigation history and state

For a deep dive, check out [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Examples

The `examples/` directory has working demos you can run:

```bash
cd examples/basic-app
npx pen build
npx pen start
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Roadmap

Things I want to add (no timeline, just a wishlist):

- [ ] Dev mode with watch/rebuild
- [ ] Dynamic routes and catch-all routes (`[id]`, `[...slug]`)
- [ ] Integration tests
- [ ] Loading states
- [ ] Route middleware
- [ ] Better error messages
- [ ] Plugin system
- [ ] TypeScript route type generation
- [ ] Parallel routes (`@modal`, `@sidebar`)

## Inspiration

This project wouldn't exist without:

- [Next.js](https://nextjs.org) - For showing that file-based routing can be elegant
- [Ink](https://github.com/vadimdemedes/ink) - For making terminal UIs actually enjoyable to build
- [TanStack Router](https://tanstack.com/router) - For ideas around type-safe routing

## Contributing

I'm learning as I build this, so the codebase is probably messy in places. That said, if you want to contribute:

- Open an issue first to discuss big changes
- Keep it simple - I'm trying to learn, not build the next industry standard
- Tests are appreciated but not required
- Don't expect fast reviews (this is a side project)

## License

MIT - See [LICENSE](LICENSE) file

## Questions?

Open an issue! I can't promise quick responses, but I'll do my best.

Happy hacking! 🚀
