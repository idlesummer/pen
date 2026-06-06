# Route validation

`buildRouteTree` builds the route tree from the filesystem and then validates it,
accumulating every finding and throwing a single `RouteValidationErrors` (or
returning the tree when clean). Validation never throws on the first error — you
edit in a tight loop, so seeing everything at once beats death-by-papercut.

The tree is rebuilt from scratch on every structural change; there is no
incremental/surgical revalidation. The code is optimised for clarity, not
partial updates.

## Two trees

| Class | File | Models |
| --- | --- | --- |
| `Route` | `internals/route.ts` | the filesystem tree — one node per directory, groups and all |
| `UrlNode` | `internals/url-node.ts` | the **projected URL tree** — groups erased, dynamics generalized, malformed pruned |

Both are data + construction only. Neither holds validation logic; the rules
live in `internals/validate.ts`, exactly as the brief keeps validation out of
`Route`.

## Two passes (split by reachability)

A check belongs to a pass based on what it needs in order to fire.

### 1. Route-tree pass — `validateRouteTree`

Pointer-local rules: everything they need is on the node itself or its ancestor
chain. These cannot move to the URL tree.

- **`MalformedSegmentError`** — an unparseable directory name (`()`, `[]`,
  `[id`). A malformed name doesn't project to a URL at all, so it's reported
  here and its subtree is pruned (a node under a broken parent is only noise).
- **`RepeatedSlugError`** — the same slug name twice on one path
  (`/[id]/x/[id]`). A property of one concrete route path.

### 2. URL-tree pass — `validateUrlTree`

Everything that only surfaces once route groups are flattened. The route tree is
projected to a `UrlNode` tree, and **cousins that resolve to the same URL
collapse into one node** — so every cross-branch rule becomes a *local* check on
a single node. Per node:

- **`DuplicateScreenError`** — two `page`s at the same URL.
- **`ConflictingDynamicSegmentsError`** — a dynamic position bound to more than
  one slug name (`[id]` vs `[slug]`), whether same-directory siblings or cousins
  across groups.
- **`DuplicateCatchallError` / `DuplicateOptionalCatchallError`** — more than one
  `[...x]` / `[[...x]]` resolving to one position.
- **`ConflictingCatchallError`** — a `[...x]` and a `[[...x]]` at the same
  position.
- **`SplatIndexConflictError`** — `[[...x]]` overlapping a static sibling.
- **`OptionalCatchallPageConflictError`** — `[[...x]]` overlapping its parent's
  own screen (it matches zero segments).
- **`CatchallNotTerminalError`** — a routable screen nested below a catch-all.

Projection rules (`UrlNode.project`): groups contribute no URL node (their own
modules attach to the parent URL, their children hoist up); `dynamic` → `[*]`,
`catchall` → `[...*]`, `optional-catchall` → `[[...*]]`; `malformed` subtrees are
pruned.

## Why the URL tree

An earlier version split these rules into *intrinsic* (same-parent, found by
pointer-walking) and *relational* (cross-group, found by projecting each route to
a URL key and bucketing). That split needed bookkeeping — the relational pass had
to skip same-parent pairs so a conflict wasn't reported twice.

Projecting to a real tree dissolves the distinction. After groups are erased,
`(a)/[id]` and `(b)/[slug]` collapse into the *same node* that `[id]`/`[slug]`
siblings would — so "different slug names for one dynamic position" is a single
check with no same-parent special case. Pass 2 is just: walk the URL tree, look
at each node.

This also closed two conflicts the key-bucketing approach missed, because they
hinge on a splat matching a *range* of URLs rather than one exact key: a
cross-group optional catch-all overlapping an index page, and a cross-group
catch-all and optional catch-all at the same position.

## What's intentionally not covered

Validation catches *ambiguities* — conflicts that route precedence cannot
resolve. It does **not** warn about precedence *shadowing* (a static route
silently winning over a catch-all, a dynamic over an optional catch-all, etc.),
because that is well-defined behaviour rather than an error. Detecting shadowing
would require pairwise URL match-set overlap analysis, which is out of scope for
the current model.

## Inspecting & testing

- `npm run test:inspect [dir]` — print the **route** tree, with any findings
  beneath it (defaults to `scripts/mock-app`).
- `npm run test:inspect:url [dir]` — print the projected **URL** tree instead.
- `npm test` — run the fixture suite (`scripts/test-validate.ts`) over
  `scripts/fixtures/*`, asserting the exact findings per case.
