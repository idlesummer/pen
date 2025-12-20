"""
  app/
  ├─ (auth)/
  │  ├─ login/
  │  │  ├─ screen.tsx
  │  │  └─ LoginForm.tsx
  │  └─ signup/
  │     └─ screen.tsx
  │
  └─ dashboard/
     ├─ layout.tsx
     ├─ screen.tsx
     ├─ Header.tsx
     ├─ settings/
     │  ├─ screen.tsx
     │  └─ profile/
     │     ├─ layout.tsx
     │     └─ screen.tsx
     └─ analytics/
        ├─ layout.tsx
        └─ screen.tsx
"""
fileTree = {
  "name": "app",
  "path": "/app",
  "children": [
    {
      "name": "(auth)",
      "path": "/app/(auth)",
      "children": [
        {
          "name": "login",
          "path": "/app/(auth)/login",
          "children": [
            { "name": "screen.tsx",    "path": "/app/(auth)/login/screen.tsx" },
            { "name": "LoginForm.tsx", "path": "/app/(auth)/login/LoginForm.tsx" }
          ]
        },
        {
          "name": "signup",
          "path": "/app/(auth)/signup",
          "children": [
            { "name": "screen.tsx", "path": "/app/(auth)/signup/screen.tsx" }
          ]
        }
      ]
    },
    {
      "name": "dashboard",
      "path": "/app/dashboard",
      "children": [
        { "name": "layout.tsx", "path": "/app/dashboard/layout.tsx" },
        { "name": "screen.tsx", "path": "/app/dashboard/screen.tsx" },
        { "name": "Header.tsx", "path": "/app/dashboard/Header.tsx" },
        {
          "name": "settings",
          "path": "/app/dashboard/settings",
          "children": [
            { "name": "screen.tsx", "path": "/app/dashboard/settings/screen.tsx" },
            {
              "name": "profile",
              "path": "/app/dashboard/settings/profile",
              "children": [
                { "name": "layout.tsx", "path": "/app/dashboard/settings/profile/layout.tsx" },
                { "name": "screen.tsx", "path": "/app/dashboard/settings/profile/screen.tsx" }
              ]
            }
          ]
        },
        {
          "name": "analytics",
          "path": "/app/dashboard/analytics",
          "children": [
            { "name": "layout.tsx", "path": "/app/dashboard/analytics/layout.tsx" },
            { "name": "screen.tsx", "path": "/app/dashboard/analytics/screen.tsx" }
          ]
        }
      ]
    },
  ]
}

routeTree = {
  "name": "app",
  "children": [
    {
      "name": "(auth)",
      "children": [
        { "name": "login" },
        { "name": "signup" }
      ]
    },
    {
      "name": "dashboard",
      "children": [
        {
          "name": "settings",
          "children": [
            { "name": "profile" }
          ]
        },
        { "name": "analytics" }
      ]
    },
    { "name": "components" },
    { "name": "profile" }
  ]
}


def build_route_tree(node, config):
    pass
