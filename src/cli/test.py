from dataclasses import dataclass, field
from math import exp
from typing import Any, Callable, Generic, Literal, TypeVar
import json


# ====================
# Sample File Tree
# ====================


"""
/project/app
├─ layout.tsx
├─ screen.tsx
├─ (marketing)/
│  ├─ layout.tsx
│  └─ about/
│     └─ screen.tsx
└─ blog/
   ├─ layout.tsx
   └─ screen.tsx
   
file_tree = {
  "name": "app",
  "path": "/project/app",
  "children": [
    {
      "name": "layout.tsx",
      "path": "/project/app/layout.tsx"
    },
    {
      "name": "screen.tsx",
      "path": "/project/app/screen.tsx"
    },
    {
      "name": "(marketing)",
      "path": "/project/app/(marketing)",
      "children": [
        {
          "name": "layout.tsx",
          "path": "/project/app/(marketing)/layout.tsx"
        },
        {
          "name": "about",
          "path": "/project/app/(marketing)/about",
          "children": [
            {
              "name": "screen.tsx",
              "path": "/project/app/(marketing)/about/screen.tsx"
            }
          ]
        }
      ]
    },
    {
      "name": "blog",
      "path": "/project/app/blog",
      "children": [
        {
          "name": "layout.tsx",
          "path": "/project/app/blog/layout.tsx"
        },
        {
          "name": "screen.tsx",
          "path": "/project/app/blog/screen.tsx"
        }
      ]
    }
  ]
}

route_tree = {
  "segment": "app",
  "layout": "/project/app/layout.tsx",
  "screen": "/project/app/screen.tsx",
  "children": [
    {
      "segment": "blog",
      "layout": "/project/app/blog/layout.tsx",
      "screen": "/project/app/blog/screen.tsx"
    },
    {
      "segment": "(marketing)",
      "isGroup": True,
      "layout": "/project/app/(marketing)/layout.tsx",
      "children": [
        {
          "segment": "about",
          "screen": "/project/app/(marketing)/about/screen.tsx"
        }
      ]
    }
  ]
}

route_manifest = {
  "/": {
    "path": "/",
    "segment": "app",
    "layouts": ["/project/app/layout.tsx"],
    "screen": "/project/app/screen.tsx"
  },
  "/blog": {
    "path": "/blog",
    "segment": "blog",
    "layouts": [
      "/project/app/layout.tsx",           # ← Inherited from app
      "/project/app/blog/layout.tsx"       # ← Own layout
    ],
    "screen": "/project/app/blog/screen.tsx"
  },
  "/about": {
    "path": "/about",                       # ← Note: no (marketing) in path!
    "segment": "about",
    "layouts": [
      "/project/app/layout.tsx",           # ← Inherited from app
      "/project/app/(marketing)/layout.tsx" # ← Inherited from (marketing) group
    ],
    "screen": "/project/app/(marketing)/about/screen.tsx"
  }
}
"""


# ====================
# tree.py
# ====================


@dataclass
class FileNode:
    name: str
    path: str
    children: list['FileNode'] | None = field(default=None)
    
    def __str__(self) -> str:
        def serialize(node: "FileNode") -> dict:
            data: dict[str, Any] = {'name': node.name, 'path': node.path}
            if node.children is not None:
                data['children'] = [serialize(child) for child in node.children]
            return data
        return json.dumps(serialize(self), indent=2)


file_tree = FileNode(
    name='app',
    path='/project/app',
    children=[
        FileNode(name='layout.tsx', path='/project/app/layout.tsx'),
        FileNode(name='screen.tsx', path='/project/app/screen.tsx'),  # ← Root screen at /
        
        # Deeply nested route groups
        FileNode(
            name='(marketing)',
            path='/project/app/(marketing)',
            children=[
                FileNode(
                    name='(special)',
                    path='/project/app/(marketing)/(special)',
                    children=[
                        FileNode(
                            name='(promo)',
                            path='/project/app/(marketing)/(special)/(promo)',
                            children=[
                                # ← This also maps to / (all groups!)
                                FileNode(name='screen.tsx', path='/project/app/(marketing)/(special)/(promo)/screen.tsx')
                            ]
                        )
                    ]
                )
            ]
        ),
    ]
)


# ====================
# tree.py
# ====================


TNode = TypeVar('TNode')

@dataclass
class TraversalOptions(Generic[TNode]):
    root: TNode
    visit: Callable[[TNode], None] | None = None           # Inspect/process current node
    expand: Callable[[TNode], list[TNode] | None] | None = None  # Get/create child nodes
    attach: Callable[[TNode, TNode], None] | None = None   # Link child to parent
    filter: Callable[[TNode], bool] | None = None          # Control child traversal


def traverse_depth_first(options: TraversalOptions[TNode]) -> TNode:
    """
    Traverse tree depth-first with preorder traversal.
    Processes parent before children, going deep before wide.
    """
    root = options.root
    visit = options.visit
    expand = options.expand
    attach = options.attach
    filter_fn = options.filter

    stack = [root]
    while stack:
        node = stack.pop()
        
        if visit:
            visit(node)
        
        children = expand(node) if expand else None
        if not children:
            continue
        
        # Process in reverse to maintain left-to-right order when popping from stack
        for child in reversed(children):
            if attach:
                attach(child, node)
            
            if filter_fn is None or filter_fn(child):
                stack.append(child)

    return root


def traverse_breadth_first(options: TraversalOptions[TNode]) -> TNode:
    """
    Traverse tree breadth-first (level by level).
    Processes all siblings before any children.
    """
    root = options.root
    visit = options.visit
    expand = options.expand
    attach = options.attach
    filter_fn = options.filter

    queue = [root]
    for node in queue:
        if visit:
            visit(node)
        
        children = expand(node) if expand else None
        if not children:
            continue

        for child in children:
            if attach:
                attach(child, node)
            
            if filter_fn is None or filter_fn(child):
                queue.append(child)

    return root


# ====================
# route-tree.py
# ====================


@dataclass(eq=False)
class RouteNode:
    url: str
    type: Literal['page', 'group']
    segment: str
    children: list['RouteNode'] | None = None
    layout: str | None = None
    screen: str | None = None

    def __hash__(self):
        return id(self)

    def __eq__(self, other: object):
        return self is other

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            'segment': self.segment,
            'url': self.url,
            'type': self.type
        }
        if self.layout:   result['layout'] = self.layout
        if self.screen:   result['screen'] = self.screen
        if self.children: result['children'] = [c.to_dict() for c in self.children]
        return result

    def __str__(self):
        return json.dumps(self.to_dict(), indent=2)


def build_route_tree(file_tree: FileNode) -> RouteNode | None:
    """
    Transform FileNode → RouteNode using DFS.
    
    Pattern: route_to_file maintains RouteNode → FileNode correspondence
    via closure, allowing expand to access source FileNode data.
    """
    if not file_tree.children:
        return None

    # Create root RouteNode
    root = RouteNode(
        url='/', 
        type='page',
        segment=file_tree.name, 
        children=[],
    )

    # Track RouteNode → FileNode mapping (captured by closure)
    route_to_file: dict[RouteNode, FileNode] = {}
    route_to_file[root] = file_tree
    
    # Global tracking of all routes with screens
    screen_routes: dict[str, str] = {}  # url → file path

    def visit(route: RouteNode):
        file = route_to_file[route]   # Already populated inside expand
        file_children = file.children
        if not file_children: return
        
        # Detect and populate metadata (side effect)
        for file in file_children:
            match file.name:
                case 'layout.tsx': route.layout = file.path
                case 'screen.tsx': route.screen = file.path
        
        # Check if this node's screen conflicts with existing routes
        if route.screen:
            if existing := screen_routes.get(route.url):
                raise ValueError(
                    f'Conflicting screen routes found at "{route.url}":\n'
                    f'  1. {existing}/screen.tsx\n'
                    f'  2. {file.path}/screen.tsx\n\n'
                    f'Multiple screen.tsx files cannot map to the same URL.\n'
                    f'Remove one of the screen.tsx files, or use different route segments.')

            screen_routes[route.url] = file.path

    # Expand node into child RouteNodes
    def expand(route: RouteNode) -> list[RouteNode] | None:
        file = route_to_file[route]
        file_children = file.children
        if not file_children: return

        # Create child RouteNodes (directories only)
        route_children: list[RouteNode] = []

        # Create children here
        for file in file_children:
            # Skip if file
            if not file.children: continue

            # Skip if private
            segment = file.name       
            if segment.startswith('_'): continue
            
            is_group = segment.startswith('(') and segment.endswith(')')
            url = route.url if is_group else f'{route.url}{segment}/'

            # Create route node here
            route_child = RouteNode(
                url=url,
                type='group' if is_group else 'page',
                segment=segment,
                children=[] # ← Always [] because we filtered out file nodes
            )

            route_to_file[route_child] = file
            route_children.append(route_child)
            
        return sorted(route_children, key=lambda c: c.segment)
    
    # Attach child to parent
    def attach(child: RouteNode, parent: RouteNode):
        assert parent.children is not None
        parent.children.append(child)

    # Build the tree
    return traverse_depth_first(TraversalOptions(
        root=root,
        visit=visit,
        expand=expand,
        attach=attach,
    ))


# ====================
# route-manifest.py
# ====================


@dataclass
class RouteMetadata:
    path: str           # URL path
    segment: str        # Last segment
    layouts: list[str]  # Inherited layout chain
    screen: str | None = None
    
    def to_dict(self) -> dict:
        result = {
            'path': self.path,
            'segment': self.segment,
            'layouts': self.layouts
        }
        if self.screen is not None:
            result['screen'] = self.screen
        return result
  
    def __str__(self):
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class RouteManifest:
    routes: dict[str, RouteMetadata] = field(default_factory=dict)

    def __getitem__(self, key: str) -> RouteMetadata:
        return self.routes[key]

    def __setitem__(self, key: str, value: RouteMetadata) -> None:
        self.routes[key] = value
        
    def __contains__(self, key: str) -> bool:
        return key in self.routes

    def to_dict(self) -> dict[str, dict]:
        return {path: meta.to_dict() for path, meta in self.routes.items()}

    def __str__(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


def build_route_manifest(route_tree: RouteNode) -> RouteManifest:
    """Build route manifest with layout inheritance."""

    # Initialize root layout
    root_layouts = [route_tree.layout] if route_tree.layout else []
    layout_map = {route_tree: root_layouts}
    manifest = RouteManifest()

    def visit(route: RouteNode):
        current_layouts = layout_map[route]
  
        # Only create a manifest if route has a screen
        if route.screen:
            manifest[route.url] = RouteMetadata(
                path=route.url,
                segment=route.segment,
                layouts=current_layouts,
                screen=route.screen)

        # Compute layouts for children
        for child in (route.children or []):
            child_layouts = [*current_layouts, child.layout] if child.layout else current_layouts
            layout_map[child] = child_layouts

    traverse_depth_first(TraversalOptions(
        root=route_tree,
        visit=visit,
        expand=lambda node: node.children,
    ))

    return manifest


# ====================
# main.py
# ====================


def main():
    print('=== Path Tree ===')
    print(file_tree)
    print()
    
    route_tree = build_route_tree(file_tree)
    print('=== Route Tree ===')
    print(route_tree)
    print()
    
    if route_tree:
        manifest = build_route_manifest(route_tree)
        print('=== Route Manifest ===')
        print(json.dumps(manifest.to_dict(), indent=2))
        print()


if __name__ == '__main__':
    main()
