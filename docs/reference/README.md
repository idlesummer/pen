# Reference Implementations

This directory contains Python prototypes used during development to validate complex logic before implementing in TypeScript.

## Purpose

When implementing complex features (like the routing system), we:
1. Prototype the algorithm in Python for rapid iteration
2. Validate the logic and edge cases
3. Re-implement in TypeScript with the same behavior

## Files

- `routing.py` - Routing system prototype (file tree → route tree → manifest)
- `router.py` - Router matching and composition logic

These are **not** part of the distributed package - they're development references only.
```

## Add to .npmignore and .gitattributes

**.npmignore:**
```
docs/
*.py
```

**.gitattributes:**
```
docs/reference/*.py linguist-documentation
```

This tells GitHub to treat Python files as documentation, not to count them in your repo's language stats.

## Alternative: Keep Separate Reference Directory

If you have many reference implementations:
```
pen/
┣ docs/
┃ ┗ ROUTE_BUILDER.md
┣ reference/          # Top-level, separate from docs
┃ ┣ README.md
┃ ┣ routing.py
┃ └ router.py
