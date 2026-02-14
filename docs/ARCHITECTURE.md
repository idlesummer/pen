# Architecture Documentation: @idlesummer/pen

**Version:** 0.1.0
**Author:** idlesummer
**Last Updated:** January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Concepts](#core-concepts)
4. [Build Pipeline](#build-pipeline)
5. [Runtime Architecture](#runtime-architecture)
6. [Key Design Decisions](#key-design-decisions)
7. [Data Flow](#data-flow)
8. [File Conventions](#file-conventions)
9. [Extension Points](#extension-points)

---

## Overview

### What is Pen?

Pen is a file-based routing framework for React Ink terminal applications, inspired by Next.js App Router. It transforms a directory structure into a navigable CLI application with automatic route generation, layout inheritance, and error boundaries.

### Design Philosophy

- **Convention over configuration**: Sensible defaults with escape hatches
- **Explicit over implicit**: Clear data flow, no magic
- **Separation of concerns**: Build-time and runtime are independent
- **Type safety first**: TypeScript throughout, strong contracts

### Target Use Case

CLI applications that need:
- Multiple screens/views with navigation
- Nested layouts (dashboard, settings, etc.)
- Error handling at different levels
- Zero routing boilerplate

---

## System Architecture

### High-Level Components

```
┌──────────────────────────────────────────────┐
│                 Pen Framework                │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐          ┌──────────────┐  │
│  │   CLI Tool   │          │   Runtime    │  │
│  │              │          │              │  │
│  │ • Commands   │          │ • Router     │  │
│  │ • Build      │──builds──▶ • Composer   │  │
│  │ • Pipeline   │          │ • Boundaries │  │
│  └──────────────┘          └──────────────┘  │
│         │                         │          │
│         │                         │          │
│    ┌────▼─────┐            ┌─────▼──────┐    │
│    │ Codegen  │            │   Router   │    │
│    │          │            │  Provider  │    │
│    │ manifest │            │            │    │
│    │ components│           │  Context   │    │
│    │ entry    │            └────────────┘    │
│    └──────────┘                              │
│                                              │
└──────────────────────────────────────────────┘
```

### Module Breakdown

```
src/
├── cli/              # Command-line interface
│   ├── commands/     # Individual commands (build, start, init)
│   └── types.ts      # CLI command contract
│
├── core/             # Framework core
│   ├── config.ts     # Configuration loading
│   ├── constants.ts  # Build-time constants
│   ├── route-builder/# Build-time route generation
│   ├── router/       # Runtime navigation
│   └── runtime/      # Runtime app composition
│
└── lib/              # Shared utilities
    ├── tree-utils.ts # BFS/DFS traversal
    └── path-utils.ts # Path manipulation
```

---

## Core Concepts

### 1. File-Based Routing

Routes are defined by the file system structure:

```
src/app/
├── layout.tsx          → Wraps all routes
├── screen.tsx          → / (root route)
└── settings/
    ├── layout.tsx      → Wraps /settings/* routes
    └── screen.tsx      → /settings/
```

**File Types:**
- `screen.tsx` - The main content (required for a route to exist)
- `layout.tsx` - Wraps child routes (optional)
- `error.tsx` - Error boundary fallback (optional)
- `not-found.tsx` - 404 fallback (optional)

### 2. Build vs Runtime Separation

**Build Time (Static):**
- Scan file system
- Generate route manifest (JSON data)
- Generate component imports
- Bundle everything

**Runtime (Dynamic):**
- Match URL against manifest
- Compose React tree from manifest
- Handle navigation
- No file system access

This separation enables:
- Fast runtime (no I/O)
- Portable builds (manifest is pure data)
- Easy testing (inject mock manifests)

### 3. Three-Phase Transformation

```
File System → Segment Tree → Route Manifest → React Tree
```

1. **File Tree**: Raw directory structure
2. **Segment Tree**: Logical routing structure with URLs
3. **Route Manifest**: Flat dictionary for runtime lookups
4. **React Tree**: Composed component hierarchy

---

## Build Pipeline

### Pipeline Architecture

The build uses a **functional task pipeline** pattern:

```typescript
const pipeline = pipe([
  ...scanTasks,      // File → Segment → Manifest
  ...generateTasks,  // Codegen TypeScript files
  ...compileTasks,   // Bundle with Rolldown
])

await pipeline.run({ appDir, outDir })
```

**Key Features:**
- Tasks are pure functions: `(Context) => Partial<Context>`
- Context flows through pipeline (immutable updates)
- Each task can add properties to context
- Built-in progress indicators (Ora spinners)

### Build Phases

#### Phase 1: Scan & Build (scanTasks)

**Task 1: Build File Tree**
```
Input:  appDir path
Output: FileNode tree (files + directories)
```

Uses BFS traversal to create a tree with:
- Relative paths (`/app/settings/screen.tsx`)
- Absolute paths (for imports)
- Parent/child relationships

**Task 2: Build Segment Tree**
```
Input:  FileNode tree
Output: SegmentNode tree (routes + URLs)
```

Transforms files into logical routes:
- Assigns URLs to each directory
- Identifies special files (screen, layout, etc.)
- Validates uniqueness (no duplicate screens per URL)

**Task 3: Generate Manifest**
```
Input:  SegmentNode tree
Output: RouteMap (flat dictionary)
```

Flattens tree into runtime-friendly format:
```typescript
{
  "/settings/": {
    url: "/settings/",
    chain: [
      { screen: "/path/to/screen", layout: "/path/to/layout" },
      { layout: "/path/to/root/layout" }
    ]
  }
}
```

#### Phase 2: Code Generation (generateTasks)

**Task 1: Write manifest.ts**
```typescript
export const manifest: RouteMap = { ... }
```

**Task 2: Write components.ts**
```typescript
import Component0 from '../../src/app/layout.js'
import Component1 from '../../src/app/screen.js'

export const components = {
  '/abs/path/to/layout': Component0,
  '/abs/path/to/screen': Component1,
}
```

**Task 3: Write entry.ts**
```typescript
export async function run(initialUrl: string) {
  const element = createElement(App, { initialUrl, manifest, components })
  const { waitUntilExit } = render(element)
  await waitUntilExit()
}
```

#### Phase 3: Compilation (compileTasks)

**Task: Bundle with Rolldown**
- Entry: `.pen/generated/entry.ts`
- Output: `.pen/dist/entry.js` (minified + sourcemaps)
- Externals: Node builtins, peer deps (react, ink)

---

## Runtime Architecture

### Component Hierarchy

```
App
└── ErrorBoundary (catches fatal errors)
    └── RouterProvider (navigation context)
        └── NotFoundBoundary (catches 404s)
            └── FileRouter (matches + composes route)
                └── [Composed Route Tree]
```

### Route Composition

Routes are composed **inside-out** (leaf → root):

```typescript
// For route: /settings/profile/

// 1. Start with screen
<Screen />

// 2. Wrap in boundaries (if present)
<NotFoundBoundary fallback={NotFound}>
  <Screen />
</NotFoundBoundary>

// 3. Wrap in layout (if present)
<Layout>
  <NotFoundBoundary>
    <Screen />
  </NotFoundBoundary>
</Layout>

// 4. Wrap in error boundary (if present)
<ErrorBoundary fallback={Error}>
  <Layout>
    <NotFoundBoundary>
      <Screen />
    </NotFoundBoundary>
  </Layout>
</ErrorBoundary>

// 5. Repeat for parent segments (ancestor layouts)
<RootLayout>
  <ErrorBoundary>
    <Layout>
      <NotFoundBoundary>
        <Screen />
      </NotFoundBoundary>
    </Layout>
  </ErrorBoundary>
</RootLayout>
```

**Why this order?**
- Error boundaries must wrap what they protect
- Layouts must wrap their content
- Not-found only wraps the screen (not inherited)

### Router State Management

```typescript
interface RouterContext {
  url: string              // Current URL
  history: string[]        // Navigation stack
  index: number            // Current position
  push: (url) => void      // Navigate forward
  replace: (url) => void   // Replace current
  back: () => void         // Go back
  forward: () => void      // Go forward
}
```

**State updates trigger re-composition:**
1. URL changes
2. FileRouter matches new URL
3. New route composed
4. React reconciles tree

---

## Key Design Decisions

### 1. Functional Task Pipeline vs Class-Based

**Decision:** Functional `pipe()` pattern

**Rationale:**
- Simpler: Pure functions, no state management
- Composable: Tasks are just arrays
- Testable: Easy to mock context
- Modern: Matches Vite, Rollup, RxJS patterns

**Alternative considered:** Listr2-style class API
**Rejected because:** More boilerplate, less composable

---

### 2. Separate Segment Tree + Manifest

**Decision:** Two-phase transformation (tree → manifest)

**Rationale:**
- **Tree phase**: Validates structure, builds URLs
- **Manifest phase**: Flattens for O(1) runtime lookups
- Separation makes each phase simpler

**Alternative considered:** Direct file tree → manifest
**Rejected because:** Would mix concerns, harder to validate

---

### 3. Absolute Paths in Manifest

**Decision:** Store absolute filesystem paths

**Rationale:**
- ComponentIndexMap can resolve to relative imports
- Manifest stays portable (just data)
- Easy to debug (full paths visible)

**Tradeoff:** Manifest not portable across machines
**Acceptable because:** Manifest is generated per build

---

### 4. Code Generation vs Dynamic Imports

**Decision:** Generate TypeScript files, then bundle

**Rationale:**
- Type safety: Generated code is type-checked
- Bundling: Rolldown optimizes everything together
- Debugging: Source maps point to real files
- Performance: No runtime `require()` overhead

**Alternative considered:** Dynamic imports at runtime
**Rejected because:** Loses type safety, slower startup

---

### 5. React createElement vs JSX

**Decision:** Use `createElement` in composer

**Rationale:**
- No JSX transform needed
- Explicit: Clear what's happening
- Works with dynamic components
- Testable: Easy to mock

**Alternative considered:** JSX strings + eval
**Rejected because:** Security risk, loses type safety

---

### 6. BFS vs DFS for File Traversal

**Decision:** BFS for file tree, DFS for segment tree

**Rationale:**
- **BFS**: Build complete level before descending (natural for directories)
- **DFS**: Visit parents before children (needed for URL inheritance)

Both are implemented with the same `TraversalOptions` pattern for consistency.

---

## Data Flow

### Build Time Flow

```
User runs: pen build

1. Load Config
   pen.config.ts → { appDir, outDir }

2. Scan Phase
   src/app/ (filesystem)
     ↓ createFileTree() [BFS]
   FileNode tree
     ↓ createSegmentTree() [DFS]
   SegmentNode tree
     ↓ createRouteMap()
   RouteMap (JSON)

3. Generate Phase
   RouteMap
     ↓ buildComponentIndexMap()
   ComponentImportMap
     ↓ codegen
   .pen/generated/
     ├── manifest.ts
     ├── components.ts
     └── entry.ts

4. Compile Phase
   .pen/generated/entry.ts
     ↓ rolldown
   .pen/dist/entry.js (bundled)
```

### Runtime Flow

```
User runs: pen start

1. Dynamic Import
   .pen/dist/entry.js
     ↓ import()
   { run() } function

2. Initialize App
   run(initialUrl)
     ↓ createElement()
   <App manifest={...} components={...} />

3. Route Matching
   User navigates to URL
     ↓ RouterProvider updates context
   FileRouter receives new URL
     ↓ matchRoute()
   Route | null

4. Composition
   Route.chain
     ↓ composeRoute()
   React Element Tree
     ↓ render()
   Terminal output
```

---

## File Conventions

### Special Files

| File | Purpose | Required |
|------|---------|----------|
| `screen.tsx` | Route content | ✅ Yes (for route to exist) |
| `layout.tsx` | Wraps children | ❌ No |
| `error.tsx` | Error boundary | ❌ No |
| `not-found.tsx` | 404 fallback | ❌ No |

### Special Directories

| Pattern | Behavior | Example |
|---------|----------|---------|
| `(group)` | URL group (doesn't add segment) | `(auth)/login/` → `/login/` |
| `_private` | Ignored by router | `_utils/`, `_test.ts` |

### Component Props

```typescript
// screen.tsx, layout.tsx
export default function Component({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

// error.tsx
export default function Error({ error, reset }: ErrorComponentProps) {
  return <Text>{error.message}</Text>
}

// not-found.tsx
export default function NotFound({ url }: NotFoundComponentProps) {
  return <Text>Not found: {url}</Text>
}
```

---

## Extension Points

### 1. Custom Task Pipeline

Add your own tasks to the build:

```typescript
const customTask: Task<BuildContext> = {
  name: 'Validate routes',
  run: async (ctx) => {
    // Custom logic
    return {} // Can add to context
  }
}

const pipeline = pipe([
  ...scanTasks,
  customTask,  // Insert anywhere
  ...generateTasks,
])
```

### 2. Config Extensions

Extend `PenConfig` for custom options:

```typescript
export interface PenConfig {
  appDir: string
  outDir: string
  // Your additions:
  basePath?: string
  plugins?: Plugin[]
}
```

### 3. Custom Components

Override default error screens:

```typescript
<App
  manifest={manifest}
  components={components}
  ErrorComponent={MyError}      // Not yet supported, but planned
  NotFoundComponent={MyNotFound}
/>
```

### 4. Route Hooks (Planned)

```typescript
// Future: Middleware/hooks
export const config = {
  beforeRender: (route) => { /* auth check */ },
  afterRender: (route) => { /* analytics */ },
}
```

---

## Performance Characteristics

### Build Time

| Phase | Complexity | Notes |
|-------|-----------|-------|
| File scan | O(n) files | Linear with file count |
| Segment tree | O(n) nodes | One pass, DFS |
| Manifest | O(n) routes | One pass, DFS |
| Codegen | O(r) routes | r = number of routes |
| Bundle | O(m) modules | m = total modules (app + deps) |

**Typical build:** ~1-3 seconds for 50 routes

### Runtime

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Route match | O(1) | Hash map lookup |
| Compose | O(d) | d = route depth (typically 2-5) |
| Navigate | O(1) | State update only |
| Render | O(c) | c = components in tree |

**Typical navigation:** <16ms (one frame)

---

## Limitations & Future Work

### Current Limitations

1. **No dynamic routes**: `/users/[id]` not yet supported
2. **No dev mode**: Must rebuild after changes
3. **No lazy loading**: All components bundled upfront
4. **No parallel routes**: Can't render multiple routes simultaneously
5. **No middleware**: No route guards or auth hooks

### Planned Features

- [ ] Watch mode (`pen dev`)
- [ ] Dynamic routes (`/users/[id]/`)
- [ ] Route groups (already parsed, not fully implemented)
- [ ] Parallel routes (`@modal`, `@sidebar`)
- [ ] Loading states (`loading.tsx`)
- [ ] Metadata API (for help text, descriptions)
- [ ] Plugin system
- [ ] TypeScript route type generation

---

## Troubleshooting

### Common Issues

**Build fails: "Directory not found"**
- Check `appDir` in `pen.config.ts`
- Ensure `src/app/` exists
- Run `pen init` to create structure

**Start fails: "Build not found"**
- Run `pen build` first
- Check `.pen/dist/entry.js` exists

**Routes not working**
- Every route needs `screen.tsx`
- Check for typos in directory names
- Ensure files export default functions

**Windows path issues**
- Framework normalizes paths automatically
- If issues persist, check for hardcoded `/` or `\`

---

## References

### Inspirations

- **Next.js App Router**: File conventions, layout nesting
- **React Router**: Nested routes concept
- **Vite**: Build tool patterns
- **Listr2**: Task pipeline UX

### Dependencies

- **React**: Component model
- **Ink**: Terminal rendering
- **Rolldown**: Fast bundling
- **Commander.js**: CLI framework
- **Ora**: Spinners

---

## Changelog

**v0.1.0** (January 2025)
- Initial release
- Basic file-based routing
- Layout inheritance
- Error boundaries
- CLI tooling (init, build, start)

---

**Questions or contributions?**
GitHub: https://github.com/idlesummer/pen
Issues: https://github.com/idlesummer/pen/issues
