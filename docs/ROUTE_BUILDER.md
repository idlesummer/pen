# Route Builder Responsibilities

A clear breakdown of what each builder does in the routing pipeline.

---

## 1. `build_file_tree()` - Filesystem Scanner

**Input:** Filesystem path (string)  
**Output:** `FileNode` tree  

### Responsibilities:
- ✅ Scan the filesystem recursively
- ✅ Read directories and files
- ✅ Create a tree representation of the file structure
- ✅ Store absolute file paths
- ✅ Differentiate files (no children) from directories (has children)

### What it does NOT do:
- ❌ No routing logic
- ❌ No special file detection
- ❌ No filtering (includes ALL files and folders)

### Example:
```
/project/app/
├─ layout.tsx
├─ _components/
└─ blog/

→ FileNode tree with ALL files/folders
```

---

## 2. `build_route_tree()` - Routing Structure Parser

**Input:** `FileNode` tree  
**Output:** `RouteNode` tree  

### Responsibilities:
- ✅ Transform file tree into routing structure
- ✅ Detect special files (`layout.tsx`, `screen.tsx`)
- ✅ Populate route metadata (layout, screen paths)
- ✅ Compute URLs for each route
- ✅ Identify route groups `(name)` vs regular routes
- ✅ Filter out private directories (`_folder`)
- ✅ Filter out files (only keep directories)
- ✅ Validate conflicting screen routes

### What it does NOT do:
- ❌ No layout inheritance (doesn't build chains)
- ❌ No flattening (keeps tree structure)
- ❌ Doesn't create final manifest

### Example:
```
FileNode(app) with layout.tsx, blog/, (marketing)/

→ RouteNode tree with:
  - url: "/"
  - layout: "/app/layout.tsx"
  - children: [blog, (marketing)]
```

---

## 3. `build_route_manifest()` - Route Flattener & Layout Resolver

**Input:** `RouteNode` tree  
**Output:** `RouteManifest` (flat dict)  

### Responsibilities:
- ✅ Flatten tree into flat dictionary (URL → metadata)
- ✅ Compute complete layout inheritance chains
- ✅ Only include routes that have screens
- ✅ Build final route metadata for runtime

### What it does NOT do:
- ❌ No validation (assumes valid tree)
- ❌ No file system access
- ❌ No URL computation (uses pre-computed URLs)

### Example:
```
RouteNode tree with nested layouts

→ Flat manifest:
{
  "/": { layouts: [app/layout.tsx], screen: ... },
  "/blog/": { layouts: [app/layout.tsx, blog/layout.tsx], screen: ... }
}
```

---

## Summary Table

| Builder | Input | Output | Main Job |
|---------|-------|--------|----------|
| `build_file_tree` | Filesystem path | FileNode tree | Scan filesystem |
| `build_route_tree` | FileNode tree | RouteNode tree | Parse routing structure + validate |
| `build_route_manifest` | RouteNode tree | RouteManifest (dict) | Flatten + inherit layouts |

---

## The Pipeline
```
Filesystem 
    ↓ (build_file_tree)
FileNode Tree (raw structure)
    ↓ (build_route_tree)
RouteNode Tree (routing structure with metadata)
    ↓ (build_route_manifest)
RouteManifest (flat, ready for runtime)
    ↓ (runtime router - not built yet)
Navigation & Rendering
```

**Each builder has one clear responsibility!** ✅ Clean separation of concerns.
