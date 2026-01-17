# Troubleshooting

Common issues and how to fix them.

## Build Issues

### "No screen.tsx found at route root"

**Problem:** The build fails with this error.

**Cause:** Every route directory needs a `screen.tsx` file. This is the actual content for that route.

**Solution:**
```bash
# Make sure you have a screen.tsx at the root
ls src/app/screen.tsx

# If it's missing, create one
echo "export default () => 'Home'" > src/app/screen.tsx
```

---

### "Invalid file convention: page.tsx"

**Problem:** You have a file that doesn't match the naming convention.

**Cause:** Pen only recognizes specific file names: `screen.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`.

**Solution:**
Rename your files to match the conventions:
```bash
# Wrong
src/app/page.tsx          ✗
src/app/index.tsx         ✗
src/app/component.tsx     ✗

# Right
src/app/screen.tsx        ✓
src/app/layout.tsx        ✓
```

If you need arbitrary files in your app directory, prefix the folder with `_`:
```bash
src/app/_components/Button.tsx    # Ignored by router
src/app/_utils/format.ts           # Ignored by router
```

---

### "pen.config.ts not found"

**Problem:** Build fails because it can't find the config file.

**Cause:** You're running `pen build` without initializing first.

**Solution:**
```bash
# Run init to create the config
npx pen init

# Or manually create pen.config.ts
cat > pen.config.ts << 'EOF'
import { defineConfig } from '@idlesummer/pen';

export default defineConfig({
  appDir: './src/app',
  outDir: './.pen',
});
EOF
```

---

### "Module not found: rolldown"

**Problem:** Build fails with missing rolldown dependency.

**Cause:** Dependencies not installed.

**Solution:**
```bash
# Install dependencies
npm install

# Or if using Pen as a package
npm install github:idlesummer/pen
```

---

### Build succeeds but generated files are missing

**Problem:** Build completes but `.pen/generated/` is empty.

**Cause:** Could be a permissions issue or the output directory is being ignored.

**Solution:**
```bash
# Check if .pen is in .gitignore (it should be)
cat .gitignore | grep .pen

# Check permissions
ls -la .pen/

# Try removing and rebuilding
rm -rf .pen
npx pen build
```

---

## Runtime Issues

### "useRouter must be used within a RouterProvider"

**Problem:** Your component crashes with this error.

**Cause:** You're using a router hook (`useUrl`, `useNavigate`, etc.) outside the router context.

**Solution:**

Make sure your component is rendered as part of a route:

```tsx
// ✗ Wrong - using hook in standalone component
import { useUrl } from '@idlesummer/pen';

function StandaloneComponent() {
  const url = useUrl();  // Crashes!
  return <Text>{url}</Text>;
}

// ✓ Right - hook used in a route component
// src/app/screen.tsx
import { useUrl } from '@idlesummer/pen';

export default function HomeScreen() {
  const url = useUrl();  // Works!
  return <Text>{url}</Text>;
}
```

If you need router state in a shared component, pass it as props:

```tsx
// Shared component (no hooks)
function Header({ url }) {
  return <Text>Current: {url}</Text>;
}

// Route component (uses hooks)
import { useUrl } from '@idlesummer/pen';

export default function Screen() {
  const url = useUrl();
  return <Header url={url} />;
}
```

---

### "Route not found: /about"

**Problem:** Navigation fails and shows 404 screen.

**Cause:** The route doesn't exist or URL is malformed.

**Solution:**

1. Check the route exists:
```bash
# Make sure you have this file
ls src/app/about/screen.tsx
```

2. Rebuild after adding routes:
```bash
npx pen build
```

3. Check URL format:
```tsx
// URLs are normalized to include trailing slash
push('/about')    // Becomes /about/
push('/about/')   // Stays /about/

// Both work, but internally they're /about/
```

4. Check route manifest:
```bash
cat .pen/generated/manifest.ts
# Look for your route in the exported object
```

---

### Navigation doesn't update the screen

**Problem:** Calling `push()` or `replace()` doesn't change the view.

**Cause:** Could be several things.

**Solution:**

1. Make sure you're using the hook correctly:
```tsx
import { useNavigate } from '@idlesummer/pen';

function MyComponent() {
  const { push } = useNavigate();

  // ✓ Right
  const handleClick = () => push('/settings');

  // ✗ Wrong - don't call during render
  push('/settings');  // Causes infinite loop!

  return <Text onPress={handleClick}>Settings</Text>;
}
```

2. Check for errors in the route you're navigating to:
```bash
# Check the terminal for error messages
npx pen start
```

3. Verify the target route exists:
```bash
cat .pen/generated/manifest.ts | grep "/settings"
```

---

### Layout not wrapping child routes

**Problem:** Your layout doesn't appear around child routes.

**Cause:** Layout might not be rendering children correctly.

**Solution:**

Make sure your layout renders the `children` prop:

```tsx
// ✗ Wrong - children not rendered
export default function Layout({ children }) {
  return (
    <Box>
      <Text>Header</Text>
      {/* Missing children! */}
    </Box>
  );
}

// ✓ Right
export default function Layout({ children }) {
  return (
    <Box>
      <Text>Header</Text>
      {children}
    </Box>
  );
}
```

---

### Error boundary not catching errors

**Problem:** App crashes instead of showing error boundary.

**Cause:** Error might be thrown outside the boundary or during initial render.

**Solution:**

1. Make sure error.tsx is in the right place:
```bash
# Catches errors in /settings and children
src/app/settings/error.tsx

# Catches all errors
src/app/error.tsx
```

2. Check the error component signature:
```tsx
// Must accept error and reset props
export default function MyError({ error, reset }) {
  return (
    <Box>
      <Text>{error.message}</Text>
      <Text onPress={reset}>Try again</Text>
    </Box>
  );
}
```

3. Some errors can't be caught (like errors in error boundaries themselves). Add a root error boundary:
```tsx
// src/app/error.tsx
export default function RootError({ error, reset }) {
  return <Text>Fatal error: {error.message}</Text>;
}
```

---

## Development Issues

### Changes not reflected after rebuild

**Problem:** You change code but don't see updates.

**Cause:** There's no dev mode yet, so you need to rebuild manually.

**Solution:**
```bash
# Always rebuild after changes
npx pen build

# Then start
npx pen start
```

**Workaround:** Use a file watcher:
```bash
# Install nodemon
npm install -D nodemon

# Watch and rebuild
npx nodemon --watch src -e ts,tsx --exec "npx pen build"

# In another terminal
npx pen start
```

---

### TypeScript errors in generated files

**Problem:** Your IDE shows errors in `.pen/generated/` files.

**Cause:** Generated files might be out of sync.

**Solution:**

1. Rebuild:
```bash
npx pen build
```

2. If errors persist, ignore the directory in tsconfig:
```json
{
  "exclude": [".pen"]
}
```

3. Or add it to `.gitignore` (should already be there):
```
.pen/
```

---

### "Permission denied" when running pen commands

**Problem:** Can't execute `pen` commands.

**Cause:** Binary not executable or permissions issue.

**Solution:**

```bash
# Make sure pen is installed
npm install

# Use npx
npx pen build

# Or install globally
npm install -g github:idlesummer/pen
pen build
```

---

## Performance Issues

### Build is very slow

**Problem:** Build takes longer than expected.

**Cause:** Large number of files or slow disk.

**Solution:**

1. Exclude unnecessary files:
```
src/app/
└── _ignored/    # Prefix with _ to skip
```

2. Check for accidental deep nesting:
```bash
# Find deeply nested routes
find src/app -type d | awk -F/ 'NF > 10'
```

3. Use a faster disk (SSD vs HDD).

---

### App is slow to start

**Problem:** `pen start` takes a long time.

**Cause:** Bundle might be large or slow imports.

**Solution:**

1. Check bundle size:
```bash
ls -lh .pen/dist/entry.js
```

2. Review dependencies:
```bash
# Check what's bundled
cat .pen/dist/entry.js | wc -l
```

3. Avoid heavy libraries if possible.

---

## Testing Issues

### Can't test components with router hooks

**Problem:** Tests fail with "useRouter must be used within RouterProvider".

**Cause:** Component needs router context.

**Solution:**

Wrap your test component in RouterProvider:

```tsx
import { render } from 'ink-testing-library';
import { RouterProvider } from '@idlesummer/pen';
import MyComponent from './MyComponent';

test('my test', () => {
  const { lastFrame } = render(
    <RouterProvider initialUrl="/test">
      <MyComponent />
    </RouterProvider>
  );

  expect(lastFrame()).toContain('expected output');
});
```

---

## Common Mistakes

### Using page.tsx instead of screen.tsx

Pen uses `screen.tsx`, not `page.tsx` (like Next.js).

```bash
# Wrong
src/app/page.tsx

# Right
src/app/screen.tsx
```

---

### Forgetting trailing slashes

URLs are normalized to end with `/`:

```tsx
// These both resolve to /about/
push('/about')
push('/about/')

// Manifest keys always have trailing slash
{
  "/about/": { ... }  // ✓
  "/about": { ... }   // ✗ Won't exist
}
```

---

### Not rebuilding after changes

There's no watch mode yet, so rebuild manually:

```bash
# After any change
npx pen build
npx pen start
```

---

### Calling navigation hooks during render

```tsx
function MyComponent() {
  const { push } = useNavigate();

  // ✗ Wrong - infinite loop
  push('/somewhere');

  // ✓ Right - in event handler
  const handleClick = () => push('/somewhere');

  return <Text onPress={handleClick}>Click me</Text>;
}
```

---

## Getting Help

If you're still stuck:

1. **Check the examples**
   ```bash
   cd examples/basic-app
   npx pen build
   npx pen start
   ```

2. **Inspect generated files**
   ```bash
   cat .pen/generated/manifest.ts
   cat .pen/generated/components.ts
   ```

3. **Enable debug logging** (when available)
   ```bash
   DEBUG=pen:* npx pen build
   ```

4. **Open an issue**
   - Go to https://github.com/idlesummer/pen/issues
   - Include error messages and relevant code
   - Mention what you've already tried

5. **Read the source**
   - The codebase is small and relatively readable
   - Start with `src/core/route-builder/` for build issues
   - Check `src/core/runtime/` for runtime issues

---

## Known Limitations

These aren't bugs, just things Pen doesn't support yet:

- **No dev mode** - Manual rebuilds required
- **No dynamic routes** - Can't do `/users/[id]`
- **No loading states** - No built-in loading UI
- **No middleware** - Can't intercept navigation
- **No lazy loading** - All routes bundled together
- **No route prefetching** - Not applicable for terminal apps
- **History is in-memory** - Lost when app restarts

Check the [roadmap](../README.md#roadmap) for planned features.
