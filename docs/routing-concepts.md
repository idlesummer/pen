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
