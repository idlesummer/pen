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
