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
class FileTreeNode:
    name: str
    path: str
    children: list['FileTreeNode'] | None = field(default=None)
    
    def __str__(self) -> str:
        def serialize(node: "FileTreeNode") -> dict:
            data: dict[str, Any] = { 'name': node.name, 'path': node.path }
            if node.children is not None:
                data['children'] = [serialize(child) for child in node.children]
            return data
        return json.dumps(serialize(self), indent=2)


file_tree = FileTreeNode(
    name='app',
    path='/project/app',
    children=[
        FileTreeNode(
            name='layout.tsx',
            path='/project/app/layout.tsx'
        ),
        FileTreeNode(
            name='screen.tsx',
            path='/project/app/screen.tsx'
        ),
        FileTreeNode(
            name='(marketing)',
            path='/project/app/(marketing)',
            children=[
                FileTreeNode(
                    name='layout.tsx',
                    path='/project/app/(marketing)/layout.tsx'
                ),
                FileTreeNode(
                    name='about',
                    path='/project/app/(marketing)/about',
                    children=[
                        FileTreeNode(
                            name='screen.tsx',
                            path='/project/app/(marketing)/about/screen.tsx'
                        )
                    ]
                )
            ]
        ),
        FileTreeNode(
            name='blog',
            path='/project/app/blog',
            children=[
                FileTreeNode(
                    name='layout.tsx',
                    path='/project/app/blog/layout.tsx'
                ),
                FileTreeNode(
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
TSource = TypeVar('TSource')

@dataclass
class TreeBuildOptions(Generic[TNode, TSource]):
    root: TNode
    expand: Callable[[TNode], list[TSource]]          # returns source data for node's children
    create_child: Callable[[TSource, TNode], TNode]   # (source, parent) -> child node
    attach: Callable[[TNode, TNode], None]            # (child, parent) side-effect attach
    should_traverse: Callable[[TNode, TSource], bool] | None = None  # (child, source) -> bool


def build_tree_dfs(options: TreeBuildOptions[TNode, TSource]) -> TNode:
    root = options.root
    expand = options.expand
    create_child = options.create_child
    attach = options.attach
    should_traverse = options.should_traverse

    stack = [root]
    while stack:
        node = stack.pop()
        sources = expand(node)
        
        for source in reversed(sources):
            child = create_child(source, node)
            attach(child, node)

            if should_traverse is None or should_traverse(child, source):
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
    

def build_route_tree(file_tree: FileTreeNode) -> RouteNode | None:
    if not file_tree.children: 
        return None

    # Step 1: Create root RouteNode
    root = RouteNode(segment=file_tree.name)
    
    # Step 2: Track RouteNode → FileTreeNode mapping
    source_map: dict[RouteNode, FileTreeNode] = {}
    source_map[root] = file_tree

    # Step 3: Define how to get children
    def expand(route_node: RouteNode) -> list[FileTreeNode]:
        file_node = source_map[route_node]
        sources = file_node.children or []
        return sorted(sources, key=lambda c: c.name)
      
    # Step 4: Define how to create a child RouteNdoe
    def create_child(file_node: FileTreeNode, _: RouteNode) -> RouteNode:
        child = RouteNode(segment=file_node.name)
        source_map[child] = file_node
        return child

    # Step 5: Define how to attach children      
    def attach(child: RouteNode, parent: RouteNode):
        if parent.children is None:
            parent.children = []
        parent.children.append(child)
      
    # Step 6: Define when to traverse deeper
    def shouldTraverse(_: RouteNode, file_node: FileTreeNode) -> bool:
        return file_node.children is not None

    # Step 7: Build the tree!
    return build_tree_dfs(TreeBuildOptions(
        root=root,
        expand=expand,
        create_child=create_child,
        attach=attach,
        should_traverse=shouldTraverse
    ))


# ====================
# main.py
# ====================


def main():
    result = build_route_tree(file_tree)
    print(result)


if __name__ == '__main__':
    main()
