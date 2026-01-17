# Contributing

Thanks for considering contributing to Pen! This is a learning project, so I appreciate your patience as I figure things out.

## Before You Start

A few things to know:

- This is a **learning project**. I'm using it to understand routing, build tools, and framework design.
- The API **will change**. Don't expect stability until v1.0 (which might never come).
- I'm doing this in my spare time. Responses might be slow.
- Small, focused contributions are easier to review than large refactors.

## Ways to Contribute

### Reporting Bugs

If you find a bug:

1. Check if it's already reported in [issues](https://github.com/idlesummer/pen/issues)
2. Create a new issue with:
   - Clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version)
   - Relevant code snippets

**Good bug report:**
```
Title: Build fails when route folder has uppercase name

Steps:
1. Create src/app/About/screen.tsx
2. Run npx pen build
3. Build fails with "Invalid route segment"

Expected: Build succeeds or shows helpful error
Actual: Cryptic error message

Environment:
- macOS 13.2
- Node 20.10.0
- @idlesummer/pen installed from GitHub main branch
```

### Suggesting Features

Feature requests are welcome, but keep in mind:

- This is a learning project, not production software
- I might not implement everything
- Simple features have better chances

Before suggesting:
1. Check if it's in the [roadmap](../README.md#roadmap)
2. Search existing issues
3. Explain the **use case**, not just the feature

**Good feature request:**
```
Title: Add support for dynamic routes

Use case:
I'm building a CLI tool that needs /users/:id routes. Currently I have to
create a route for each user ID manually, which doesn't scale.

Proposed solution:
Support [id] folder syntax like Next.js:
src/app/users/[id]/screen.tsx

Alternative considered:
Could use query params but that's less elegant
```

### Contributing Code

I welcome PRs! Here's how:

## Development Setup

### Prerequisites

- Node.js >= 24
- npm >= 10
- Git

### Clone and Install

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/pen.git
cd pen
npm install
```

### Project Structure

```
pen/
├── src/
│   ├── bin.ts              # CLI entry point
│   ├── index.ts            # Public API exports
│   ├── cli/                # CLI commands
│   ├── core/
│   │   ├── route-builder/  # Build-time route generation
│   │   ├── router/         # Runtime navigation
│   │   ├── runtime/        # Runtime app composition
│   │   └── build-tools/    # Build utilities
│   └── lib/                # Shared utilities
├── examples/               # Example apps
├── docs/                   # Documentation
└── tests/                  # Tests
```

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b fix-something
   ```

2. **Make your changes**
   - Keep it focused (one fix/feature per PR)
   - Follow existing code style
   - Add tests if applicable

3. **Test your changes**
   ```bash
   # Run tests
   npm test

   # Build the library
   npm run build

   # Try it in an example
   cd examples/basic-app
   npx pen build
   npx pen start
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "Fix: properly handle uppercase route names"
   ```

   Commit message format:
   - `Fix: ...` for bug fixes
   - `Add: ...` for new features
   - `Update: ...` for improvements
   - `Docs: ...` for documentation
   - `Test: ...` for tests

5. **Push and open PR**
   ```bash
   git push origin fix-something
   ```
   Then open a PR on GitHub.

## Code Guidelines

### Style

We use ESLint for linting. Your code should:
- Use single quotes for strings
- No semicolons
- 2-space indentation
- Prefer `const` over `let`
- Use TypeScript strict mode

Run the linter:
```bash
npm run lint
```

### TypeScript

- Always add types (no `any` unless absolutely necessary)
- Use interfaces for object shapes
- Export public types from `src/index.ts`

### Testing

We use Vitest. Add tests for:
- New features
- Bug fixes
- Complex logic

Run tests:
```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:coverage # Coverage report
```

Example test:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Documentation

If your change affects the public API:
- Update relevant docs in `docs/`
- Add examples if helpful
- Update README.md if needed

## PR Guidelines

Good PRs:
- Are focused on one thing
- Include tests
- Update documentation
- Have clear commit messages
- Reference related issues

**Before submitting:**

- [ ] Code builds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Documentation updated
- [ ] Tested in example app

## Areas That Need Help

If you want to contribute but don't know where to start:

### Easy Wins
- Fix typos in documentation
- Improve error messages
- Add more examples
- Write tests for uncovered code

### Medium Difficulty
- Improve CLI output formatting
- Add validation for edge cases
- Optimize build performance
- Better error handling

### Challenging
- Implement dev mode with watch
- Add dynamic route support
- Create plugin system
- Improve sourcemap generation

Check issues labeled `good first issue` or `help wanted`.

## Architecture Overview

Understanding the architecture helps when contributing:

### Build Pipeline

1. **Scan** (`src/core/route-builder/builders/file-tree.ts`)
   - Walks filesystem
   - Builds tree of FileNodes

2. **Transform** (`src/core/route-builder/builders/segment-tree.ts`)
   - Converts FileNodes to SegmentNodes
   - Computes URLs
   - Validates structure

3. **Generate** (`src/core/route-builder/builders/route-manifest.ts`)
   - Flattens tree to RouteManifest
   - Creates component import map

4. **Codegen** (`src/cli/commands/build/tasks/generate.ts`)
   - Writes TypeScript files
   - Generates entry point

5. **Bundle** (`src/cli/commands/build/tasks/compile.ts`)
   - Bundles with Rolldown
   - Produces executable

### Runtime

1. **App** (`src/core/runtime/App.tsx`)
   - Top-level component
   - Sets up error boundary and router

2. **RouterProvider** (`src/core/router/RouterProvider.tsx`)
   - Manages navigation state
   - Provides context to children

3. **FileRouter** (`src/core/runtime/FileRouter.tsx`)
   - Matches URL to route
   - Composes component tree

4. **Boundaries** (`src/core/runtime/boundaries/`)
   - Error and NotFound boundaries
   - Wrap route components

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more details.

## Questions?

Feel free to:
- Open an issue for discussion
- Comment on existing issues
- Ask in your PR

Don't be shy! I'm learning too.

## Code of Conduct

Be nice. That's it.

- Respectful communication
- Constructive feedback
- No harassment or discrimination
- Assume good intentions

## License

By contributing, you agree your contributions will be licensed under the MIT License.

---

Thanks for contributing! Every bit helps, whether it's fixing a typo or implementing a major feature.
