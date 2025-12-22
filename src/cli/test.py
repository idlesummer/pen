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
"""


@dataclass
class PathNode:
    name: str
    path: str
    children: list['PathNode'] | None = field(default=None)
    
    def __str__(self) -> str:
        def serialize(node: "PathNode") -> dict:
            data: dict[str, Any] = { 'name': node.name, 'path': node.path }
            if node.children is not None:
                data['children'] = [serialize(child) for child in node.children]
            return data
        return json.dumps(serialize(self), indent=2)


file_tree = PathNode(
    name='app',
    path='/project/app',
    children=[
        PathNode(
            name='layout.tsx',
            path='/project/app/layout.tsx'
        ),
        PathNode(
            name='screen.tsx',
            path='/project/app/screen.tsx'
        ),
        PathNode(
            name='(marketing)',
            path='/project/app/(marketing)',
            children=[
                PathNode(
                    name='layout.tsx',
                    path='/project/app/(marketing)/layout.tsx'
                ),
                PathNode(
                    name='about',
                    path='/project/app/(marketing)/about',
                    children=[
                        PathNode(
                            name='screen.tsx',
                            path='/project/app/(marketing)/about/screen.tsx'
                        )
                    ]
                )
            ]
        ),
        PathNode(
            name='blog',
            path='/project/app/blog',
            children=[
                PathNode(
                    name='layout.tsx',
                    path='/project/app/blog/layout.tsx'
                ),
                PathNode(
                    name='screen.tsx',
                    path='/project/app/blog/screen.tsx'
                )
            ]
        )
    ]
)


# ====================
# tree-builder.py
# ====================


TNode = TypeVar('TNode')

@dataclass
class TreeBuildOptions(Generic[TNode]):
    root: TNode
    expand: Callable[[TNode], list[TNode] | None]   # Returns child nodes
    attach: Callable[[TNode, TNode], None]          # Attach child to parent
    filter: Callable[[TNode], bool] | None = None   # True = traverse child, False = attach only (don't traverse)

def build_tree_dfs(options: TreeBuildOptions[TNode]) -> TNode:
    root = options.root
    expand = options.expand
    attach = options.attach
    filter = options.filter

    stack = [root]
    while stack:
        node = stack.pop()
        children = expand(node)
        
        for child in reversed(children or []):
            attach(child, node)
            if filter is None or filter(child):     # Add to stack conditionally
                stack.append(child)

    return root


# ====================
# route-tree.py
# ====================


@dataclass
class RouteNode:
    segment: str
    layout: str | None = None
    screen: str | None = None
    children: list['RouteNode'] | None = None
    
    def __hash__(self):
        return id(self)
    
    def __eq__(self, other: 'RouteNode'): 
        return self is other
      
    def _to_dict(self) -> dict:
        result: dict[str, Any] = {'segment': self.segment}
        if self.layout is not None: result['layout'] = self.layout
        if self.screen is not None: result['screen'] = self.screen
        if self.children: result['children'] = [child._to_dict() for child in self.children]
        return result
      
    def __str__(self):
        return json.dumps(self._to_dict(), indent=2)
    

def build_route_tree(file_tree: PathNode) -> RouteNode | None:
    """
    Transform PathNode → RouteNode using DFS.
    
    Pattern: route_to_path maintains RouteNode → PathNode correspondence
    via closure, allowing expand to access source PathNode data.
    """

    if not file_tree.children: 
        return None

    # Step 1: Create root RouteNode
    root = RouteNode(segment=file_tree.name, children=[])
    
    # Step 2: Track RouteNode → PathNode mapping (captured by closure)
    route_to_path: dict[RouteNode, PathNode] = {}
    route_to_path[root] = file_tree

    # Step 3: Expand node into child RouteNodes
    def expand(route_node: RouteNode) -> list[RouteNode] | None:
        # Get source PathNode via closure
        path_node = route_to_path[route_node]
        path_children = path_node.children
        if path_children is None:
            return None
        
        # Detect special files and populate route_node metadata
        for path_child in path_children:
            match path_child.name:
                case 'layout.tsx': route_node.layout = path_child.path
                case 'screen.tsx': route_node.screen = path_child.path
        
        # Create and return child RouteNodes (directories only)
        route_children = []
        for path_child in path_children:
            if path_child.children is None: 
                continue
            
            route_child = RouteNode(segment=path_child.name, children=[])
            route_to_path[route_child] = path_child
            route_children.append(route_child)
            
        return sorted(route_children, key=lambda c: c.segment)
      
    # Step 5: Define how to attach children      
    def attach(child: RouteNode, parent: RouteNode):
        assert parent.children is not None
        parent.children.append(child)

    # Step 7: Build the tree!
    return build_tree_dfs(TreeBuildOptions(
        root=root,
        expand=expand,
        attach=attach,
    ))


# ====================
# main.py
# ====================


def main():
    result = build_route_tree(file_tree)
    print(f'file_tree = {file_tree}\n')
    print(f'route_tree = {result}')


if __name__ == '__main__':
    main()
