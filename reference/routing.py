"""
Reference Implementation - Routing System

Builds a routing system from filesystem structure:
  Filesystem → File Tree → Route Tree → Route Manifest

Key concepts:
- Route groups like (marketing) organize files without affecting URLs
- Private folders starting with _ are ignored
- Layouts inherit from parent to child
- Only routes with screen.tsx appear in final manifest

Example:
  /app/(marketing)/about/screen.tsx
  → URL: /about/
  → Inherits layouts from: app and (marketing)

See: src/ for the TypeScript implementation
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Generic, Literal, TypeVar
import json


# ====================
# File Tree
# ====================


@dataclass
class FileNode:
    name: str
    path: str
    children: list['FileNode'] | None = None
    
    def __str__(self) -> str:
        def serialize(node: "FileNode") -> dict:
            data: dict[str, Any] = {'name': node.name, 'path': node.path}
            if node.children is not None:
                data['children'] = [serialize(child) for child in node.children]
            return data
        return json.dumps(serialize(self), indent=2)


# ====================
# Traversal
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
    """Visit parent before children, go deep before wide."""
    root = options.root
    visit = options.visit
    expand = options.expand
    attach = options.attach
    filter = options.filter

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
            if not filter or filter(node):
                stack.append(child)

    return root


def traverse_breadth_first(options: TraversalOptions[TNode]) -> TNode:
    """Visit all siblings before any children."""
    root = options.root
    visit = options.visit
    expand = options.expand
    attach = options.attach
    filter = options.filter

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
            if not filter or filter(node):
                queue.append(child)

    return root


# ====================
# Route Tree
# ====================


@dataclass(eq=False)
class RouteNode:
    url: str                                  # Full URL like "/blog/"
    type: Literal['page', 'group']            # "page" or "group" 
    segment: str                              # Directory name like "blog"
    layout: str | None = None                 # Path to layout.tsx
    screen: str | None = None                 # Path to screen.tsx
    children: list['RouteNode'] | None = None

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
    Transform file tree into route tree.
    
    - Detects layout.tsx and screen.tsx files
    - Computes URLs for each route
    - Filters out private directories (_folder)
    - Validates no duplicate screens at same URL
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

    route_to_file = {root: file_tree}   # Map route → file
    screen_routes: dict[str, str] = {}  # Track duplicate screens

    def visit(parent_route: RouteNode):
        """Find special files and check for duplicates."""
        parent_file = route_to_file[parent_route]   # Already populated inside expand
        
        # Detect layout.tsx and screen.tsx
        for file in parent_file.children or []:
            match file.name:
                case 'layout.tsx': parent_route.layout = file.path
                case 'screen.tsx': parent_route.screen = file.path
        
        # Check for duplicate screens
        if parent_route.screen:
            if existing_file := screen_routes.get(parent_route.url):
                raise ValueError(
                    f'Conflicting screen routes found at "{parent_route.url}":\n'
                    f'  1. {existing_file}/screen.tsx\n'
                    f'  2. {parent_file.path}/screen.tsx\n\n'
                    f'Multiple screen.tsx files cannot map to the same URL.\n'
                    f'Remove one of the screen.tsx files, or use different route segments.')
            screen_routes[parent_route.url] = parent_file.path

    # Expand node into child RouteNodes
    def expand(parent_route: RouteNode) -> list[RouteNode] | None:
        """Create child routes from directories."""
        parent_file = route_to_file[parent_route]
        if not parent_file.children: return
        route_children: list[RouteNode] = []        # Create child RouteNodes (dirs only)

        # Create children here
        for file in parent_file.children:
            if not file.children: continue          # Skip if file
            if file.name.startswith('_'): continue  # Skip if private dirs
            segment  = file.name       
            is_group = segment.startswith('(') and segment.endswith(')')
            url  = parent_route.url if is_group else f'{parent_route.url}{segment}/'
            type = 'group' if is_group else 'page'

             # Always children=[] because we filtered out file nodes
            route_child = RouteNode(url, type, segment, children=[])
            route_to_file[route_child] = file
            route_children.append(route_child)

        return sorted(route_children, key=lambda c: c.segment)
    
    def attach(child: RouteNode, parent: RouteNode):
        """Add child to parent's children."""
        assert parent.children is not None
        parent.children.append(child)

    # Build the tree
    return traverse_depth_first(TraversalOptions(root, visit, expand, attach))


# ====================
# Route Manifest
# ====================


@dataclass
class RouteMetadata:
    url: str                           # URL path like "/blog/"
    segment: str                        # Last segment like "blog"
    screen: str | None = None           # Path to screen.tsx
    layouts: list[str] | None = None    # Inherited layouts (root to leaf)

    def to_dict(self) -> dict:
        result: dict[str, Any] = {'path': self.url, 'segment': self.segment}
        if self.screen is not None:  result['screen'] = self.screen
        if self.layouts is not None: result['layouts'] = self.layouts
        return result
  
    def __str__(self):
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class RouteManifest:
    """URL-to-metadata lookup table."""
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
    """
    Flatten route tree into manifest.
    
    - Creates URL-to-metadata lookup
    - Computes layout inheritance chains
    - Only includes routes with screens
    """

    # Initialize root layout
    root_layouts = [route_tree.layout] if route_tree.layout else []
    layout_map = {route_tree: root_layouts}
    manifest = RouteManifest()

    def visit(parent_route: RouteNode):
        """Add routes with screens to manifest."""
        parent_layouts = layout_map[parent_route] # Always available
        if not parent_route.screen: return  # Only create manifest if this route has a screen
        
        url = parent_route.url
        segment = parent_route.segment
        screen = parent_route.screen
        metadata = RouteMetadata(url, segment, screen)
        if len(parent_layouts): 
            metadata.layouts = parent_layouts

        manifest[parent_route.url] = metadata

    def expand(parent_route: RouteNode):
        """Get children and compute their layouts."""
        parent_layouts = layout_map[parent_route]
        
        # Compute layouts for children and store in layout map
        for route in parent_route.children or []:
            layouts = [*parent_layouts, route.layout] if route.layout else parent_layouts
            layout_map[route] = layouts
        return parent_route.children

    traverse_depth_first(TraversalOptions(route_tree, visit, expand))
    return manifest


# ====================
# Example
# ====================


file_tree = FileNode(
    name='app',
    path='/project/app',
    children=[
        FileNode(name='layout.tsx', path='/project/app/layout.tsx'),
        FileNode(name='screen.tsx', path='/project/app/screen.tsx'),
        FileNode(
            name='(marketing)',
            path='/project/app/(marketing)',
            children=[
                FileNode(name='layout.tsx', path='/project/app/(marketing)/layout.tsx'),
                FileNode(
                    name='about',
                    path='/project/app/(marketing)/about',
                    children=[
                        FileNode(name='screen.tsx', path='/project/app/(marketing)/about/screen.tsx')
                    ]
                )
            ]
        ),
        FileNode(
            name='blog',
            path='/project/app/blog',
            children=[
                FileNode(name='layout.tsx', path='/project/app/blog/layout.tsx'),
                FileNode(name='screen.tsx', path='/project/app/blog/screen.tsx')
            ]
        )
    ]
)


def main():
    print('=== Path Tree ===')
    print(file_tree)
    print()
    
    route_tree = build_route_tree(file_tree)
    print('=== Route Tree ===')
    print(route_tree)
    print()
    
    if not route_tree: return
    manifest = build_route_manifest(route_tree)
    print('=== Route Manifest ===')
    print(json.dumps(manifest.to_dict(), indent=2))
    print()


if __name__ == '__main__':
    main()
