# @idlesummer/pen

> **Personal Project / Learning Exercise**
>
> This is my first attempt at building a routing framework. I'm learning as I go!
> Use at your own risk. API will change. Bugs expected.

File-based routing for Ink terminal apps (inspired by Next.js).

## Status

**Experimental** - This is a personal learning project

- ✅ Basic routing works
- ✅ Layouts and nested routes
- ✅ Error boundaries
- ❌ Dev mode not implemented yet
- ❌ Documentation incomplete
- ❌ Not battle-tested

**Use for:** Personal projects, experiments, learning
**Don't use for:** Production apps (yet!)

## Installation
```bash
npm install @idlesummer/pen
```

## Quick Start
```bash
# Create your app structure
mkdir -p src/app
echo "export default () => 'Hello!'" > src/app/screen.tsx

# Build and run
npx pen build
npx pen start
```

## Examples

See `examples/` directory for working demos.

## Feedback

I'm still learning! If you find bugs or have ideas:
- Open an issue
- Don't expect quick fixes (this is a side project)
- PRs welcome but no guarantees

## Inspiration

Built while learning from:
- Next.js App Router
- Ink

## License

MIT - See LICENSE file
