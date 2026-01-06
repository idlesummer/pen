# Quick Reference

## Commands
```bash
pen build    # Build manifest + compile
pen start    # Run the app
```

## Usage in App
```tsx
import { useRouter } from '@idlesummer/pen'

function MyScreen() {
  const router = useRouter()

  router.push('/about/')      // Navigate
  router.replace('/home/')    // Replace
  router.back()               // Back
  router.forward()            // Forward

  router.url                  // Current URL
  router.history              // Full history array
  router.index                // Current position
}
```

## File Structure
```
src/app/
├── layout.tsx       → Root layout
├── screen.tsx       → Home page (/)
├── about/
│   └── screen.tsx   → About page (/about/)
└── (auth)/          → Route group (no URL segment)
    ├── layout.tsx   → Auth layout
    └── login/
        └── screen.tsx → Login page (/login/)
```

## Examples
- `examples/router/` - Basic navigation
- `examples/history/` - History management
- `examples/layouts/` - Nested layouts

**This one file is 80% of what you need!** ✅

---

### 2. **Update Main README**

Just make it **functional**, not beautiful:
```markdown
# @idlesummer/pen
```

File-based routing for Ink terminal apps (like Next.js but for CLI).

## Install
```bash
npm install @idlesummer/pen
```

## Quick Start
1. Create `src/app/screen.tsx` (home page)
2. Run `pen build`
3. Run `pen start`

## Docs
- [Quick Reference](./docs/quick-reference.md) - All you need
- [Architecture](./docs/architecture/) - How it works

## Examples
- `examples/router/` - Basic example
- `examples/history/` - History demo
```

That's it! No need for fancy sections.

---

### 3. **Add CHANGELOG (Actually Useful!)**

Even for private projects, CHANGELOG helps **future you** remember what changed:
````markdown
# Changelog

## [0.1.0] - 2025-01-07

### Added
- File-based routing system
- `useRouter()` hook with push/replace/back/forward
- History management (exposed history + index)
- Build command (`pen build`)
- Start command (`pen start`)
- Support for layouts, screens, route groups

### Known Issues
- Dev mode not implemented (use build + start)
- No error.tsx support yet
```

**Why this matters:** In 6 months when you come back, you'll remember what works and what doesn't.

---

## 🧹 **Cleanup Recommendations**

### **1. Remove Experiments**
```bash
# Move or delete these:
rm -rf docs/reference/tasks/        # Task pipeline experiments
rm -f test.js                       # Listr2 demo

# Or move to separate folder:
mkdir -p experiments/
mv docs/reference/tasks/ experiments/
mv test.js experiments/
```

Then add to `.gitignore`:
```gitignore
# Experiments
experiments/
```

---

### **2. Empty Files**

**Option A:** Delete it
```bash
rm src/cli/commands/dev.ts
```

**Option B:** Add stub with explanation
```typescript
// src/cli/commands/dev.ts
/**
 * Dev mode - NOT IMPLEMENTED YET
 *
 * TODO: Add watch mode with hot reload
 * For now: Use `pen build && pen start` manually
 */

export function devCommand() {
  throw new Error('Dev mode not implemented. Use: pen build && pen start')
}
```

I'd go with **Option A** - just delete it until you need it.

---

### **3. Python Reference Files**

These are actually **useful** for reference! But make it clearer:
````
docs/
└── reference/
    ├── README.md      ← Update this
    ├── routing.py     ✅ Keep
    └── router.py      ✅ Keep
`````

Update the README:
`````markdown
# Reference Implementations

**Prototypes for complex algorithms before TypeScript implementation.**

## Files
- `routing.py` - Route builder pipeline (file tree → manifest)
- `router.py` - Route matching & composition

## Why Python?
Faster to prototype complex logic, then re-implement in TS with confidence.

## Not Part of Package
These files are for **development reference only** and not included in the distributed package.
```

---

## 📁 **Recommended File Structure**
```
pen/
├── src/                    ✅ Keep as-is (it's good!)
├── dist/                   ✅ Build output
├── examples/               ✅ Keep
├── docs/
│   ├── quick-reference.md  🆕 ADD THIS (most important!)
│   ├── architecture/
│   │   └── ROUTE_BUILDER.md ✅ Keep (technical details)
│   └── reference/
│       ├── README.md       ✅ Update
│       ├── routing.py      ✅ Keep
│       └── router.py       ✅ Keep
├── experiments/            🆕 Optional: Move test.js here
├── README.md               🆕 Simplify (see above)
├── CHANGELOG.md            🆕 ADD THIS (track changes)
├── package.json            ✅ Already good
├── tsconfig.json           ✅ Already good
├── tsup.config.ts          ✅ Already good
├── .gitignore              ✅ Already good
└── .gitattributes          ✅ Good enough for private
```

# Don't need:
❌ LICENSE (private package)
❌ CONTRIBUTING.md (solo project)
❌ .editorconfig (your IDE handles it)
❌ .npmrc (not publishing)
❌ SECURITY.md (overkill for private)
