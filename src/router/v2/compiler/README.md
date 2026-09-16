# v2 compiler

Three stages, one direction, nothing flowing back.

```
app/          the source of truth - only changes when you edit files
  |  parse
RouteNode     the parse. Never leaves compile().
  |  compile
PositionNode  the artifact. Everything downstream needs, and nothing more.
```

`compile(filePaths)` returns the position tree, the module paths for the generated
component map, and diagnostics. The route tree is not returned: it is build
state, not an output.

## Invariants

**1. The route tree is built once and never mutated.** No default injection, no
pruning of invalid routes. The first is a routing guarantee, relocated to frame
construction; the second is a skip rule in the position-tree walk. Because nothing
mutates it, validation and compilation can run in either order.

**2. `PositionNode` reaches no `RouteNode`.** Every field is a string, a number,
or another `PositionNode`. Runtime therefore *cannot* consult the parse, and the
route tree is collectable the moment `compile()` returns. If you add a field,
check this still holds - it is the property everything else rests on.

**3. Conflicts stay off the node.** Duplicate pages, duplicate defaults, and
param clashes are build state that exists only to be reported. Keeping them in
a separate structure is what lets `PositionNode` be exactly the runtime
contract, with nothing transient in it - and route nodes live there, not on
the node, because only a folder has a file path a diagnostic can name.

**4. A `Frame` is shared by reference everywhere it's used.** `createFrame`
memoises in `PositionContext.frameOf`, keyed by folder, including the
undefined case; `removeDefault`'s stripped variant is memoised the same way
in `strippedOf`, keyed by the frame it strips. A chain of five wrappers
appearing in both a page endpoint and several positions' fallbacks is five
pointers repeated, not five fresh copies each time.

## The acceptance test

Any field earns its place by making this sentence true:

> Rendering a URL is: walk down the tree consuming segments, then iterate one
> array. No ancestor loops. No second cursor.

If a sketch of "render `/blog/42`" needs a walk over parents, the shape is
wrong - however tidy the type looks.

## Not yet here

Matching and rendering. `Endpoint` is shaped for them - `frames` is the full
wrapper chain outermost-first, `paramDepth`/`contentDepth` say which position's
params each part sees, verified to stay continuous through a slot boundary
rather than reset there (checked against a real Next.js build) - but nothing
consumes it yet.
