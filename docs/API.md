# API Reference

Complete API documentation for @idlesummer/pen.

## Configuration

### `defineConfig(config)`

Helper function to create a typed configuration object.

```typescript
import { defineConfig } from '@idlesummer/pen';

export default defineConfig({
  appDir: './src/app',
  outDir: './.pen',
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appDir` | `string` | `'./src/app'` | Directory containing your route files |
| `outDir` | `string` | `'./.pen'` | Build output directory |

## Router Hooks

All hooks must be used within a component tree wrapped by `RouterProvider`.

### `useRouter()`

Returns the full router context.

```typescript
import { useRouter } from '@idlesummer/pen';

function MyComponent() {
  const router = useRouter();

  console.log(router.url);        // Current URL
  console.log(router.data);       // Route data
  console.log(router.history);    // Navigation history
  console.log(router.position);   // Current position in history

  router.push('/about');          // Navigate forward
  router.replace('/home');        // Replace current route
  router.back();                  // Go back
  router.forward();               // Go forward
}
```

#### Return Type

```typescript
interface RouterContextValue {
  url: string;
  data: unknown;
  history: readonly string[];
  position: number;
  push: (url: string, data?: unknown) => void;
  replace: (url: string) => void;
  back: () => void;
  forward: () => void;
}
```

### `useNavigate()`

Returns navigation functions only. Use this when you just need to navigate.

```typescript
import { useNavigate } from '@idlesummer/pen';

function MyComponent() {
  const { push, replace } = useNavigate();

  return (
    <Box>
      <Text onPress={() => push('/settings')}>Settings</Text>
      <Text onPress={() => replace('/home')}>Home (replace)</Text>
    </Box>
  );
}
```

#### Return Type

```typescript
interface NavigateResult {
  push: (url: string, data?: unknown) => void;
  replace: (url: string) => void;
}
```

### `useUrl()`

Returns the current URL as a string.

```typescript
import { useUrl } from '@idlesummer/pen';

function Breadcrumb() {
  const url = useUrl();
  return <Text>Current: {url}</Text>;
}
```

#### Return Type

```typescript
string
```

### `useHistory()`

Returns navigation history and history controls.

```typescript
import { useHistory } from '@idlesummer/pen';

function HistoryControls() {
  const { history, position, back, forward } = useHistory();

  const canGoBack = position > 0;
  const canGoForward = position < history.length - 1;

  return (
    <Box>
      <Text dimColor>History: {history.join(' → ')}</Text>
      {canGoBack && <Text onPress={back}>← Back</Text>}
      {canGoForward && <Text onPress={forward}>Forward →</Text>}
    </Box>
  );
}
```

#### Return Type

```typescript
interface HistoryResult {
  history: readonly string[];
  position: number;
  back: () => void;
  forward: () => void;
}
```

### `useRouteData()`

Returns data passed during navigation.

```typescript
import { useNavigate, useRouteData } from '@idlesummer/pen';

// Component A
function ListPage() {
  const { push } = useNavigate();

  const handleSelect = (item) => {
    push('/detail', { selectedItem: item });
  };

  return <ItemList onSelect={handleSelect} />;
}

// Component B
function DetailPage() {
  const data = useRouteData();
  const item = data?.selectedItem;

  return <Text>Viewing: {item.name}</Text>;
}
```

#### Return Type

```typescript
unknown
```

## Component Props

### Layout Component

Layout components receive `children` prop automatically.

```typescript
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function MyLayout({ children }: LayoutProps) {
  return (
    <Box flexDirection="column">
      <Header />
      {children}
      <Footer />
    </Box>
  );
}
```

### Screen Component

Screen components receive no props by default. Use hooks to access router state.

```typescript
export default function HomeScreen() {
  return <Text>Home</Text>;
}
```

### Error Component

Error boundaries receive `error` and `reset` props.

```typescript
interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function MyError({ error, reset }: ErrorProps) {
  return (
    <Box flexDirection="column">
      <Text color="red">Error: {error.message}</Text>
      <Text dimColor>{error.stack}</Text>
      <Text onPress={reset}>Try again</Text>
    </Box>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `error` | `Error` | The caught error object |
| `reset` | `() => void` | Callback to retry rendering |

### Not Found Component

Not found components receive the attempted URL.

```typescript
interface NotFoundProps {
  url: string;
}

export default function MyNotFound({ url }: NotFoundProps) {
  const { push } = useNavigate();

  return (
    <Box flexDirection="column">
      <Text>404: {url} not found</Text>
      <Text onPress={() => push('/')}>Go home</Text>
    </Box>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | The URL that wasn't found |

## CLI Commands

### `pen init`

Initialize a new Pen project.

```bash
npx pen init
```

Creates:
- `pen.config.ts` - Project configuration
- `src/app/layout.tsx` - Root layout
- `src/app/screen.tsx` - Home screen

### `pen build`

Build your application for production.

```bash
npx pen build
```

Process:
1. Scans `appDir` for route files
2. Generates TypeScript files in `outDir/generated/`
3. Bundles with Rolldown into `outDir/dist/entry.js`

Options:
- None currently (coming soon)

### `pen start [url]`

Run your built application.

```bash
# Start at root
npx pen start

# Start at specific route
npx pen start /settings/profile
```

Arguments:
- `url` (optional) - Initial route to navigate to

## Types

### Core Types

```typescript
// Route manifest structure
interface RouteManifest {
  [url: string]: Route;
}

interface Route {
  url: string;
  chain: SegmentRoles[];
}

interface SegmentRoles {
  screen?: string;
  layout?: string;
  error?: string;
  notFound?: string;
}

// Component map
interface ComponentImportMap {
  [absolutePath: string]: ComponentType<any>;
}

// Router context
interface RouterContextValue {
  url: string;
  data: unknown;
  history: readonly string[];
  position: number;
  push: (url: string, data?: unknown) => void;
  replace: (url: string) => void;
  back: () => void;
  forward: () => void;
}

// Config
interface PenConfig {
  appDir: string;
  outDir: string;
}
```

## Advanced Usage

### Programmatic API

You can use Pen's build tools programmatically:

```typescript
import { buildApp } from '@idlesummer/pen/cli';
import { loadConfig } from '@idlesummer/pen/core';

async function customBuild() {
  const config = await loadConfig();
  await buildApp(config);
}
```

Note: This API is unstable and will change. Check the source for current exports.

### Custom Entry Point

Generate your own entry point instead of using the default:

```typescript
// my-entry.ts
import { createElement } from 'react';
import { render } from 'ink';
import { App } from '@idlesummer/pen/runtime';
import manifest from './.pen/generated/manifest.js';
import components from './.pen/generated/components.js';

const element = createElement(App, {
  initialUrl: '/custom',
  manifest,
  components,
});

const { waitUntilExit } = render(element);
await waitUntilExit();
```

### Custom Error/NotFound Screens

Override default screens at the root level:

```typescript
// src/app/error.tsx
export default function RootError({ error, reset }) {
  return (
    <Box borderStyle="round" borderColor="red" padding={1}>
      <Text color="red" bold>Fatal Error</Text>
      <Text>{error.message}</Text>
      <Text dimColor>Check the logs for more info</Text>
    </Box>
  );
}

// src/app/not-found.tsx
export default function RootNotFound({ url }) {
  return (
    <Box borderStyle="round" borderColor="yellow" padding={1}>
      <Text color="yellow">Route not found: {url}</Text>
      <Text>Try checking the URL or navigate home</Text>
    </Box>
  );
}
```

## Debugging

### Enable Verbose Logging

Set `DEBUG` environment variable:

```bash
DEBUG=pen:* npx pen build
```

### Inspect Generated Code

Check `.pen/generated/` directory after building:

```bash
cat .pen/generated/manifest.ts
cat .pen/generated/components.ts
cat .pen/generated/entry.ts
```

### Check Route Manifest

The manifest shows all detected routes and their component chains:

```typescript
{
  "/": {
    url: "/",
    chain: [
      { screen: "/abs/path/to/app/screen.tsx" },
      { layout: "/abs/path/to/app/layout.tsx" }
    ]
  },
  "/settings/": {
    url: "/settings/",
    chain: [
      { screen: "/abs/path/to/app/settings/screen.tsx" },
      { layout: "/abs/path/to/app/settings/layout.tsx" },
      { layout: "/abs/path/to/app/layout.tsx" }
    ]
  }
}
```

## Error Handling

### Build Errors

Common build errors and solutions:

**"No screen.tsx found at route root"**
- Every route needs a `screen.tsx` file
- Check you didn't accidentally name it `page.tsx` or something else

**"Invalid file convention"**
- Only use supported file names: `screen.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`
- Don't put arbitrary files in route directories

**"Duplicate routes detected"**
- Check for conflicting route segments
- Remember `(groups)` don't add URL segments

### Runtime Errors

**"useRouter must be used within RouterProvider"**
- You're using a router hook outside the component tree
- Make sure your component is rendered as part of a route

**"Route not found"**
- Check the URL you're navigating to exists
- URLs must end with `/` (normalized automatically)
- Case-sensitive matching

## Performance Tips

1. **Keep layouts small** - They re-render on every route change
2. **Use error boundaries** - Catch errors close to where they happen
3. **Avoid complex state in layouts** - Use context or data passing instead
4. **Structure routes logically** - Deep nesting can impact composition time

## Limitations

Current limitations to be aware of:

- No dynamic route segments (coming soon)
- No route middleware
- No loading states
- History is in-memory only (lost on restart)
- URLs are normalized to trailing `/`
- File system must be scanned every build (no incremental compilation)

---

For more details, see:
- [Architecture Overview](./ARCHITECTURE.md)
- [Examples](./EXAMPLES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
