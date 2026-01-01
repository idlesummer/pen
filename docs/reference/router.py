"""
Python Prototype - Import Map & Router

Tests the import map concept before implementing in TypeScript.
This demonstrates how components would be loaded and nested.
"""

from dataclasses import dataclass
from typing import Protocol
import json


# ====================
# Component Protocol
# ====================

class Component(Protocol):
    """Protocol for components (layouts and screens)."""
    
    def render(self, children: str = "") -> str:
        """Render component to string, optionally with children."""
        ...


# ====================
# Example Components
# ====================

@dataclass
class RootLayout:
    """Root layout component."""
    
    def render(self, children: str = "") -> str:
        return f"""
┌─────────────────────────────────┐
│ 🏠 Root Layout                  │
├─────────────────────────────────┤
{self._indent(children)}
└─────────────────────────────────┘
"""
    
    def _indent(self, text: str) -> str:
        return '\n'.join(f"│ {line}" for line in text.strip().split('\n'))


@dataclass
class MarketingLayout:
    """Marketing layout component."""
    
    def render(self, children: str = "") -> str:
        return f"""
┌───────────────────────────┐
│ 📢 Marketing Layout       │
├───────────────────────────┤
{self._indent(children)}
└───────────────────────────┘
"""
    
    def _indent(self, text: str) -> str:
        return '\n'.join(f"│ {line}" for line in text.strip().split('\n'))


@dataclass
class BlogLayout:
    """Blog layout component."""
    
    def render(self, children: str = "") -> str:
        return f"""
┌───────────────────────────┐
│ 📝 Blog Layout            │
├───────────────────────────┤
{self._indent(children)}
└───────────────────────────┘
"""
    
    def _indent(self, text: str) -> str:
        return '\n'.join(f"│ {line}" for line in text.strip().split('\n'))


@dataclass
class HomeScreen:
    """Home screen component."""
    
    def render(self, children: str = "") -> str:
        return """Welcome to the Home Screen!
URL: /
"""


@dataclass
class AboutScreen:
    """About screen component."""
    
    def render(self, children: str = "") -> str:
        return """This is the About Screen
URL: /about/
Inherits: Root → Marketing
"""


@dataclass
class BlogScreen:
    """Blog screen component."""
    
    def render(self, children: str = "") -> str:
        return """Welcome to the Blog!
URL: /blog/
Inherits: Root → Blog
"""


# ====================
# Import Map (Registry)
# ====================

# This simulates the generated TypeScript import map
COMPONENT_REGISTRY = {
    'RootLayout': RootLayout,
    'MarketingLayout': MarketingLayout,
    'BlogLayout': BlogLayout,
    'HomeScreen': HomeScreen,
    'AboutScreen': AboutScreen,
    'BlogScreen': BlogScreen,
}


def load_component(path: str) -> Component:
    """
    Load a component from the registry.
    Simulates: import Component from 'path'
    """
    component_class = COMPONENT_REGISTRY.get(path)
    
    if not component_class:
        available = ', '.join(COMPONENT_REGISTRY.keys())
        raise ValueError(
            f'Component not found: {path}\n'
            f'Available: {available}'
        )
    
    return component_class()


# ====================
# Route Metadata & Manifest
# ====================

@dataclass
class RouteMetadata:
    url: str
    screen: str | None = None
    layouts: list[str] | None = None


class RouteManifest:
    def __init__(self, routes: dict[str, RouteMetadata]):
        self.routes = routes
    
    def get(self, url: str) -> RouteMetadata | None:
        return self.routes.get(url)


def match_route(url: str, manifest: RouteManifest) -> RouteMetadata | None:
    """Match URL against manifest."""
    normalized = url if url.endswith('/') else f'{url}/'
    return manifest.get(normalized)


# ====================
# Router
# ====================

def render_route(url: str, manifest: RouteManifest) -> str:
    """
    Router - matches route and renders component tree.
    
    This is the equivalent of your React Router component.
    """
    # Step 1: Match the route
    metadata = match_route(url, manifest)
    
    # Step 2: Handle 404
    if not metadata or not metadata.screen:
        return f"❌ 404 - Route Not Found: {url}"
    
    # Step 3: Load the screen component
    screen = load_component(metadata.screen)
    
    # Step 4: Render the screen
    result = screen.render()
    
    # Step 5: Wrap with layouts (already in render order: leaf → root)
    if metadata.layouts:
        for layout_path in metadata.layouts:
            layout = load_component(layout_path)
            result = layout.render(children=result)
    
    return result


# ====================
# Example Manifest
# ====================

manifest = RouteManifest({
    '/': RouteMetadata(
        url='/',
        screen='HomeScreen',
        layouts=['RootLayout'],
    ),
    '/about/': RouteMetadata(
        url='/about/',
        screen='AboutScreen',
        layouts=['MarketingLayout', 'RootLayout'],  # leaf → root order
    ),
    '/blog/': RouteMetadata(
        url='/blog/',
        screen='BlogScreen',
        layouts=['BlogLayout', 'RootLayout'],  # leaf → root order
    ),
})


# ====================
# Test the Router
# ====================

def test_router():
    """Test the router with different URLs."""
    
    print('=' * 60)
    print('Python Router Prototype - Import Map Concept')
    print('=' * 60)
    print()
    
    test_urls = ['/', '/about/', '/blog/', '/404/']
    
    for url in test_urls:
        print(f'Route: {url}')
        print('-' * 60)
        result = render_route(url, manifest)
        print(result)
        print()


# ====================
# Demonstrate Import Map Generation
# ====================

def generate_import_map(manifest: RouteManifest) -> str:
    """
    Generate import map code from manifest.
    
    This demonstrates what the Python build script would generate
    for TypeScript.
    """
    # Collect all unique component paths
    paths = set()
    for metadata in manifest.routes.values():
        if metadata.screen:
            paths.add(metadata.screen)
        if metadata.layouts:
            paths.update(metadata.layouts)
    
    # Generate Python code (for demonstration)
    imports = []
    exports = []
    
    for i, path in enumerate(sorted(paths)):
        var_name = f'Component{i}'
        imports.append(f"from components import {path} as {var_name}")
        exports.append(f"    '{path}': {var_name},")
    
    python_code = f"""# Auto-generated component registry
{chr(10).join(imports)}

COMPONENT_REGISTRY = {{
{chr(10).join(exports)}
}}
"""
    
    # Generate TypeScript equivalent
    ts_imports = []
    ts_exports = []
    
    for i, path in enumerate(sorted(paths)):
        var_name = f'Component{i}'
        # Assume components are in @/app/
        import_path = f"@/app/{path.lower().replace('layout', 'layout').replace('screen', 'screen')}"
        ts_imports.append(f"import * as {var_name} from '{import_path}'")
        ts_exports.append(f"  '{path}': {var_name}.default,")
    
    typescript_code = f"""// Auto-generated component registry
{chr(10).join(ts_imports)}

export const components = {{
{chr(10).join(ts_exports)}
}}
"""
    
    return f"""
Python Version:
{python_code}

TypeScript Version:
{typescript_code}
"""


def demo_import_map_generation():
    """Show what the import map generation would produce."""
    print('=' * 60)
    print('Import Map Generation Demo')
    print('=' * 60)
    print()
    print('Input: manifest.json')
    print(json.dumps({url: {
        'url': m.url,
        'screen': m.screen,
        'layouts': m.layouts
    } for url, m in manifest.routes.items()}, indent=2))
    print()
    print('-' * 60)
    print('Output: Generated Import Maps')
    print('-' * 60)
    print(generate_import_map(manifest))


# ====================
# Main
# ====================

if __name__ == '__main__':
    # Test the router
    test_router()
    
    print()
    print()
    
    # Demo import map generation
    demo_import_map_generation()