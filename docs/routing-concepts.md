# Routing concepts

## anchor

static/dynamic/slot folders each get their own SearchNode; group/catchall/malformed folders are transparent and share their parent's.

```
  blog/                     <- anchor (static)
  └── (reviews)/            <- NOT anchor (group)
      └── (critics)/        <- NOT anchor (group)
          ├── featured/     <- anchor (static)
          │   └── page.tsx
          └── archive/      <- anchor (static)
              └── page.tsx
```

Both featured and archive anchor to themselves; (reviews) and (critics) anchor to blog, the nearest real folder before the group chain began.

## page / catchall

Where anchor looks outward (nearest ancestor-or-self of a real type), page/catchall look inward: the nearest descendant-or-self, reachable only through transparent (group/catchall/malformed) folders, that actually owns a page.tsx. Each SearchNode has a "territory" - its own anchor folder plus every descendant reachable without crossing into another anchor - and page/catchall is whichever folder in that territory owns a page.tsx, split by that folder's own segment type.

```
  docs/                     <- anchor (static); territory = {docs, [...slug]}
  ├── page.tsx              <- docs.page   (docs itself owns this, so page === anchor)
  └── [...slug]/            <- NOT anchor (catchall) - but still inside docs's territory
      └── page.tsx          <- docs.catchall (the descendant that actually claims it)
```

Both docs.page and docs.catchall belong to the same SearchNode (docs's), since [...slug] never gets its own anchor - it's transparent, so its page.tsx still lands in docs's territory. Which one gets used at match time depends on whether the URL is exhausted exactly at docs (/docs -> docs.page) or has more segments left (/docs/a/b -> docs.catchall).

- SearchTree: what routes are possible?
- MatchTree: which possible routes won for this URL?
- RouteTree: what is actually defined at those routes?
- RenderTree: combines the winning match with the defined content

## default

Next.js splits "nothing else claimed this position" into two files - `default.tsx` for an unmatched parallel-route slot, `not-found.tsx` for an unmatched URL. This framework treats them as the same situation and merges them into one: `default` is the framework's not-found boundary. There's no separate not-found.tsx.

The root always has a default - a real one if the app provides one, the framework's own built-in fallback otherwise - guaranteed at compile time, not caught at runtime. A URL that matches nothing still resolves to a renderable tree; there's no "not found" state left for React to catch after the fact.

Every slot gets that same guarantee independently, not just the root:

```
  app/
  ├── page.tsx
  ├── default.tsx        <- root's default; doubles as the app's not-found boundary
  └── @sidebar/
      └── widget/
          └── page.tsx   <- @sidebar has no default.tsx of its own
```

- `/`     -> children: page.tsx,    sidebar: framework's built-in default (no match, no default.tsx in @sidebar)
- `/widget` -> children: default.tsx, sidebar: widget/page.tsx (real match)
- `/nope` -> children: default.tsx, sidebar: framework's built-in default

Without this guarantee, `@sidebar` would just be missing from the render output whenever nothing in it matched - not an error, just a silently absent pane. Each slot owning its own default, always, is what keeps that from happening.

## runtime

`src/router/` (decision layer) and `src/react/runtime/` (runtime layer) are deliberately separate - router has zero React/Ink imports anywhere, produces plain data (a `RenderNode` tree), and every "what if" (unmatched URL, missing slot content) gets resolved *inside* it, provably, before any component ever renders. The runtime layer only translates already-decided data into elements; it never has to guess.

Navigation state is the one thing genuinely runtime-only - it doesn't exist until an app instance is alive. Three layers:

- `Navigation` (navigation.ts) - a plain class, no React, no way to be observed. Mutates `position`/`history`, that's it.
- the store (store.ts) - wraps `Navigation` and adds what it has none of: a `listeners` Set, `subscribe`/`getSnapshot`, and actions that mutate then `emit()`. Still zero React - this is the generic observable-wrapper shape, pluggable into anything.
- `useSyncExternalStore(store.subscribe, store.getSnapshot)` - the one React-specific piece, in `use-navigate.ts`. Every other hook derives from this one call.

Getting the store to those hooks: `NavigationProvider` creates the ONE store per app instance - `const [navigationStore] = useState(() => createNavigationStore('/'))` - and provides it via `<NavigationContext value={navigationStore}>`. Every hook retrieves that same reference with `use(NavigationContext)`. Calling `useSyncExternalStore(store.subscribe, store.getSnapshot)` is what "subscribing" concretely means - it hands the store a callback (React's own re-render trigger) that gets added to the store's `listeners` Set.

`getSnapshot` is where the value comes from - called on *every* render, not once, because React never owns a copy of external data the way it owns `useState`'s. `subscribe` is the doorbell, called once per mount, telling React when to go re-check that door. The listener React registers carries no data - `emit()` calls every listener with zero arguments - it's a "something changed, go look" ping, not a push. Simplified shape of what's inside `useSyncExternalStore`:

```js
function useSyncExternalStore(subscribe, getSnapshot) {
  // A hidden useState whose value is never read - it exists purely as a
  // lever to pull. Calling its setter is what schedules a re-render;
  // the value itself means nothing.
  const [, forceRerender] = useState(false)

  // Called on every render (unlike the effect below) - the actual data,
  // read fresh each time, since React never stores a copy of it.
  const value = getSnapshot()

  useEffect(() => {
    const handleChange = () => {
      // Fired whenever OUR store's emit() runs. Re-check the source of
      // truth, and only bother re-rendering if it actually changed - the
      // Object.is safety net, though it only catches identical references.
      const currentValue = getSnapshot()
      const hasChanged = !Object.is(currentValue, value)
      if (hasChanged)
        forceRerender(x => !x)
    }
    const unsubscribe = subscribe(handleChange)   // register on mount
    return unsubscribe                             // unsubscribe on unmount
  }, [subscribe, getSnapshot])
  // Both listed, not because THIS caller's values ever change, but
  // because the hook has no way to know that about any caller.

  return value
}
```

That `Object.is` check is a real safety net, but only for identical references - it doesn't catch a freshly-rebuilt object with unchanged values. `Navigation.back()`/`forward()` used to let the store's `emit()` fire unconditionally, even sitting at the start/end of history where nothing actually moved - producing a new snapshot object every time and wasting a re-render React's own check couldn't have caught. Fixed by having `back()`/`forward()` report whether they actually moved, so the store only emits when something real changed - the guard condition stays in exactly one place (`Navigation`), never duplicated at the store level.

Thinking of the store's whole surface in CRUD terms makes it fall out cleanly - and it's two separate collections that never cross:

- the `listeners` Set - `subscribe` = Create, the `unsubscribe` it returns = Delete. Nothing else touches it.
- the navigation data - `getSnapshot` = Read, `push` = Create+Update (drops any forward history, appends a new entry), `replace` = Update, `back`/`forward` = Update-only (no Create, no Delete - just moves `position`).

Subscribing never touches navigation data, and pushing/replacing never touches `listeners`. The only thing that crosses between the two is `emit()` - it reads the fresh navigation data into `snapshot`, then walks `listeners` to say "go look."
