from dataclasses import dataclass, field
from math import exp
from typing import Any, Callable, Generic, Iterable, TypeVar
import json


# ====================
# Sample File Tree
# ====================


"""
/project/app
├─ layout.tsx
├─ view.tsx
├─ (marketing)/
│  ├─ layout.tsx
│  └─ about/
│     └─ view.tsx
└─ blog/
   ├─ layout.tsx
   └─ view.tsx
   
path_tree = {
  "name": "app",
  "path": "/project/app",
  "children": [
    {
      "name": "layout.tsx",
      "path": "/project/app/layout.tsx"
    },
    {
      "name": "view.tsx",
      "path": "/project/app/view.tsx"
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
              "name": "view.tsx",
              "path": "/project/app/(marketing)/about/view.tsx"
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
          "name": "view.tsx",
          "path": "/project/app/blog/view.tsx"
        }
      ]
    }
  ]
}

route_tree = {
  "segment": "app",
  "layout": "/project/app/layout.tsx",
  "view": "/project/app/view.tsx",
  "children": [
    {
      "segment": "blog",
      "layout": "/project/app/blog/layout.tsx",
      "view": "/project/app/blog/view.tsx"
    },
    {
      "segment": "(marketing)",
      "isGroup": True,
      "layout": "/project/app/(marketing)/layout.tsx",
      "children": [
        {
          "segment": "about",
          "view": "/project/app/(marketing)/about/view.tsx"
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
    "view": "/project/app/view.tsx"
  },
  "/blog": {
    "path": "/blog",
    "segment": "blog",
    "layouts": [
      "/project/app/layout.tsx",           # ← Inherited from app
      "/project/app/blog/layout.tsx"       # ← Own layout
    ],
    "view": "/project/app/blog/view.tsx"
  },
  "/about": {
    "path": "/about",                       # ← Note: no (marketing) in path!
    "segment": "about",
    "layouts": [
      "/project/app/layout.tsx",           # ← Inherited from app
      "/project/app/(marketing)/layout.tsx" # ← Inherited from (marketing) group
    ],
    "view": "/project/app/(marketing)/about/view.tsx"
  }
}
"""


# ====================
# tree.py
# ====================


@dataclass
class PathNode:
    name: str
    path: str
    children: list['PathNode'] | None = field(default=None)
    
    def __str__(self) -> str:
        def serialize(node: "PathNode") -> dict:
            data: dict[str, Any] = {'name': node.name, 'path': node.path}
            if node.children is not None:
                data['children'] = [serialize(child) for child in node.children]
            return data
        return json.dumps(serialize(self), indent=2)


path_tree = PathNode(
    name='app',
    path='/project/app',
    children=[
        PathNode(name='layout.tsx', path='/project/app/layout.tsx'),
        PathNode(name='view.tsx', path='/project/app/view.tsx'),
        PathNode(
            name='(marketing)',
            path='/project/app/(marketing)',
            children=[
                PathNode(name='layout.tsx', path='/project/app/(marketing)/layout.tsx'),
                PathNode(
                    name='about',
                    path='/project/app/(marketing)/about',
                    children=[
                        PathNode(name='view.tsx', path='/project/app/(marketing)/about/view.tsx')
                    ]
                )
            ]
        ),
        PathNode(
            name='blog',
            path='/project/app/blog',
            children=[
                PathNode(name='layout.tsx', path='/project/app/blog/layout.tsx'),
                PathNode(name='view.tsx', path='/project/app/blog/view.tsx')
            ]
        )
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

@dataclass
class RouteNode:
    segment: str
    children: list['RouteNode'] | None = None
    
    # Metadata
    is_group: bool = False
    
    # Special files
    view: str | None = None
    layout: str | None = None
    
    def __hash__(self):
        return id(self)
    
    def __eq__(self, other: 'RouteNode'): 
        return self is other
      
    def _to_dict(self) -> dict:
        result: dict[str, Any] = {'segment': self.segment}
        if self.is_group:
            result['isGroup'] = self.is_group
        if self.layout is not None:
            result['layout'] = self.layout
        if self.view is not None:
            result['view'] = self.view
        if self.children:
            result['children'] = [child._to_dict() for child in self.children]
        return result
      
    def __str__(self):
        return json.dumps(self._to_dict(), indent=2)


def build_route_tree(path_tree: PathNode) -> RouteNode | None:
    """
    Transform PathNode → RouteNode using DFS.
    
    Pattern: route_to_path maintains RouteNode → PathNode correspondence
    via closure, allowing expand to access source PathNode data.
    """
    if not path_tree.children:
        return None

    # Create root RouteNode
    root = RouteNode(segment=path_tree.name, children=[])
    
    # Track RouteNode → PathNode mapping (captured by closure)
    route_to_path: dict[RouteNode, PathNode] = {}
    route_to_path[root] = path_tree

    # Expand node into child RouteNodes
    def expand(route_node: RouteNode) -> list[RouteNode] | None:
        path_node = route_to_path[route_node]
        path_children = path_node.children
        if path_children is None:
            return None
        
        # Detect special files and populate route_node metadata
        for path_child in path_children:
            match path_child.name:
                case 'layout.tsx': route_node.layout = path_child.path
                case 'view.tsx':   route_node.view = path_child.path
                case 'view.tsx': route_node.view = path_child.path  # Alias for view
        
        # Create child RouteNodes (directories only)
        route_children = []
        for path_child in path_children:
            if path_child.children is None:
                continue
            
            segment = path_child.name
            is_group = segment.startswith('(') and segment.endswith(')')
            route_child = RouteNode(segment=segment, children=[])
            if is_group:
                route_child.is_group = True
            
            route_to_path[route_child] = path_child
            route_children.append(route_child)
            
        return sorted(route_children, key=lambda c: c.segment)
    
    # Attach child to parent
    def attach(child: RouteNode, parent: RouteNode):
        assert parent.children is not None
        parent.children.append(child)

    # Build the tree
    return traverse_depth_first(TraversalOptions(
        root=root,
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
    view: str | None = None
    
    def to_dict(self) -> dict:
        result = {
            'path': self.path,
            'segment': self.segment,
            'layouts': self.layouts
        }
        if self.view is not None:
            result['view'] = self.view
        return result
    
    def __str__(self):
        return json.dumps(self.to_dict(), indent=2)


def build_route_manifest(route_tree: RouteNode) -> dict[str, dict]:
    """Build route manifest from route tree."""
    manifest: dict[str, dict] = {}
    
    def visit(node: RouteNode):
        if node.view:
            manifest[node.segment] = {
                'segment': node.segment,
                'view': node.view,
            }

    traverse_depth_first(TraversalOptions(
        root=route_tree,
        expand=lambda node: node.children,
        visit=visit
    ))
    
    return manifest


# ====================
# main.py
# ====================


def main():
    print('=== Path Tree ===')
    print(path_tree)
    print()
    
    route_tree = build_route_tree(path_tree)
    print('=== Route Tree ===')
    print(route_tree)
    print()
    
    if route_tree:
        manifest = build_route_manifest(route_tree)
        print('=== Route Manifest ===')
        print(json.dumps(manifest, indent=2))
        # manifest_dict = {
        #     path: metadata.to_dict() 
        #     for path, metadata in manifest.items()
        # }
        # print(json.dumps(manifest_dict, indent=2))
        print()


if __name__ == '__main__':
    main()
