# Basic App - Pen Routing Example

This example demonstrates the core routing features of Pen.

## Features

- **File-based routing**: Routes are automatically generated from the file structure
- **Nested layouts**: Dashboard section has its own layout
- **Dynamic routes**: `/users/[id]` accepts any user ID
- **Clean structure**: Each route is a separate component

## File Structure

```
src/app/
├── layout.tsx                 # Root layout (wraps all routes)
├── screen.tsx                 # Home page (/)
├── about/
│   └── screen.tsx            # About page (/about)
├── dashboard/
│   ├── layout.tsx            # Dashboard layout (wraps all /dashboard/* routes)
│   ├── screen.tsx            # Dashboard home (/dashboard)
│   ├── stats/
│   │   └── screen.tsx        # Stats page (/dashboard/stats)
│   └── settings/
│       └── screen.tsx        # Settings page (/dashboard/settings)
└── users/
    └── [id]/
        └── screen.tsx        # Dynamic user page (/users/:id)
```

## Running

```bash
# Install dependencies (from repo root)
npm install

# Build the app
npm run build

# Start the app
npm start
```

## Routes

- `/` - Home page
- `/about` - About page
- `/dashboard` - Dashboard home
- `/dashboard/stats` - Statistics
- `/dashboard/settings` - Settings
- `/users/123` - User profile (dynamic)
- `/users/alice` - Another user profile (dynamic)
