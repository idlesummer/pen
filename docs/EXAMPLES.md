# Examples

Real-world patterns and examples for building apps with Pen.

## Basic Patterns

### Simple Multi-Page App

```
src/app/
├── layout.tsx
├── screen.tsx
├── about/
│   └── screen.tsx
├── contact/
│   └── screen.tsx
└── settings/
    └── screen.tsx
```

```tsx
// src/app/layout.tsx
import { Box, Text } from 'ink';

export default function RootLayout({ children }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="blue">My CLI App</Text>
      <Box marginTop={1}>{children}</Box>
    </Box>
  );
}

// src/app/screen.tsx
import { Text } from 'ink';
import { useNavigate } from '@idlesummer/pen';

export default function Home() {
  const { push } = useNavigate();

  return (
    <Box flexDirection="column">
      <Text>Welcome! Navigate with arrow keys:</Text>
      <Text onPress={() => push('/about')}>→ About</Text>
      <Text onPress={() => push('/contact')}>→ Contact</Text>
      <Text onPress={() => push('/settings')}>→ Settings</Text>
    </Box>
  );
}
```

### Navigation Menu Component

```tsx
// src/app/components/NavMenu.tsx
import { Box, Text } from 'ink';
import { useUrl, useNavigate } from '@idlesummer/pen';

interface NavItem {
  label: string;
  url: string;
}

const items: NavItem[] = [
  { label: 'Home', url: '/' },
  { label: 'Dashboard', url: '/dashboard' },
  { label: 'Settings', url: '/settings' },
];

export function NavMenu() {
  const currentUrl = useUrl();
  const { push } = useNavigate();

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      {items.map(item => {
        const isActive = currentUrl === item.url;
        return (
          <Text
            key={item.url}
            color={isActive ? 'green' : undefined}
            bold={isActive}
            onPress={() => push(item.url)}
          >
            {isActive ? '► ' : '  '}{item.label}
          </Text>
        );
      })}
    </Box>
  );
}

// src/app/layout.tsx
import { Box } from 'ink';
import { NavMenu } from './components/NavMenu';

export default function RootLayout({ children }) {
  return (
    <Box flexDirection="row">
      <NavMenu />
      <Box flexGrow={1} marginLeft={2}>
        {children}
      </Box>
    </Box>
  );
}
```

## Advanced Patterns

### Nested Layouts

```
src/app/
├── layout.tsx                    # Root layout (global header)
├── screen.tsx
└── dashboard/
    ├── layout.tsx                # Dashboard layout (sidebar)
    ├── screen.tsx                # Dashboard home
    ├── analytics/
    │   └── screen.tsx
    └── reports/
        ├── layout.tsx            # Reports layout (tabs)
        ├── screen.tsx
        ├── sales/
        │   └── screen.tsx
        └── inventory/
            └── screen.tsx
```

```tsx
// src/app/layout.tsx (global)
import { Box, Text } from 'ink';

export default function RootLayout({ children }) {
  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="single" padding={1}>
        <Text bold>My App v1.0</Text>
      </Box>
      {children}
    </Box>
  );
}

// src/app/dashboard/layout.tsx (sidebar)
import { Box, Text } from 'ink';
import { useUrl, useNavigate } from '@idlesummer/pen';

export default function DashboardLayout({ children }) {
  const url = useUrl();
  const { push } = useNavigate();

  return (
    <Box flexDirection="row" height="100%">
      <Box flexDirection="column" borderStyle="single" padding={1}>
        <Text bold>Dashboard</Text>
        <Text
          color={url === '/dashboard/' ? 'green' : undefined}
          onPress={() => push('/dashboard')}
        >
          Overview
        </Text>
        <Text
          color={url === '/dashboard/analytics/' ? 'green' : undefined}
          onPress={() => push('/dashboard/analytics')}
        >
          Analytics
        </Text>
        <Text
          color={url === '/dashboard/reports/' ? 'green' : undefined}
          onPress={() => push('/dashboard/reports')}
        >
          Reports
        </Text>
      </Box>
      <Box flexGrow={1} padding={1}>
        {children}
      </Box>
    </Box>
  );
}

// src/app/dashboard/reports/layout.tsx (tabs)
import { Box, Text } from 'ink';
import { useUrl, useNavigate } from '@idlesummer/pen';

export default function ReportsLayout({ children }) {
  const url = useUrl();
  const { push } = useNavigate();

  return (
    <Box flexDirection="column">
      <Box gap={2}>
        <Text
          color={url === '/dashboard/reports/sales/' ? 'cyan' : undefined}
          onPress={() => push('/dashboard/reports/sales')}
        >
          [Sales]
        </Text>
        <Text
          color={url === '/dashboard/reports/inventory/' ? 'cyan' : undefined}
          onPress={() => push('/dashboard/reports/inventory')}
        >
          [Inventory]
        </Text>
      </Box>
      <Box marginTop={1}>{children}</Box>
    </Box>
  );
}
```

### Error Boundaries at Different Levels

```tsx
// src/app/error.tsx (catch-all for entire app)
import { Box, Text } from 'ink';
import { useNavigate } from '@idlesummer/pen';

export default function RootError({ error, reset }) {
  const { push } = useNavigate();

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="red" padding={2}>
      <Text color="red" bold>Something went wrong!</Text>
      <Text>{error.message}</Text>
      <Box marginTop={1} gap={2}>
        <Text onPress={reset} color="yellow">[Try Again]</Text>
        <Text onPress={() => push('/')} color="blue">[Go Home]</Text>
      </Box>
    </Box>
  );
}

// src/app/settings/error.tsx (catch errors in settings only)
import { Box, Text } from 'ink';

export default function SettingsError({ error, reset }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="yellow">Settings error: {error.message}</Text>
      <Text dimColor>Your settings might be corrupted</Text>
      <Text onPress={reset} color="cyan">Reset to defaults</Text>
    </Box>
  );
}
```

### Custom 404 Pages

```tsx
// src/app/not-found.tsx (root level)
import { Box, Text } from 'ink';
import { useNavigate } from '@idlesummer/pen';

export default function NotFound({ url }) {
  const { push } = useNavigate();

  return (
    <Box flexDirection="column" alignItems="center" padding={2}>
      <Text bold>404 - Not Found</Text>
      <Text dimColor>The route "{url}" doesn't exist</Text>
      <Box marginTop={1}>
        <Text onPress={() => push('/')} color="blue">
          ← Back to Home
        </Text>
      </Box>
    </Box>
  );
}

// src/app/docs/not-found.tsx (custom for docs section)
import { Box, Text } from 'ink';
import { useNavigate } from '@idlesummer/pen';

export default function DocsNotFound({ url }) {
  const { push } = useNavigate();

  return (
    <Box flexDirection="column" padding={1}>
      <Text>Documentation page not found: {url}</Text>
      <Text dimColor>Try checking the docs index</Text>
      <Text onPress={() => push('/docs')} color="cyan">
        View all docs
      </Text>
    </Box>
  );
}
```

## State Management

### Passing Data Between Routes

```tsx
// List page
import { useNavigate } from '@idlesummer/pen';

export default function UserList() {
  const { push } = useNavigate();
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  return (
    <Box flexDirection="column">
      {users.map(user => (
        <Text key={user.id} onPress={() => push('/user', { user })}>
          {user.name}
        </Text>
      ))}
    </Box>
  );
}

// Detail page
import { useRouteData, useNavigate } from '@idlesummer/pen';

export default function UserDetail() {
  const data = useRouteData();
  const { back } = useNavigate();

  if (!data?.user) {
    return <Text>No user selected</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text>User: {data.user.name}</Text>
      <Text onPress={back}>← Back</Text>
    </Box>
  );
}
```

### Using React Context for Global State

```tsx
// src/app/context/AppContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <AppContext.Provider value={{ theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

// src/app/layout.tsx
import { AppProvider } from './context/AppContext';

export default function RootLayout({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}

// Any screen or component
import { useAppContext } from '../context/AppContext';

export default function Settings() {
  const { theme, setTheme } = useAppContext();

  return (
    <Box>
      <Text>Current theme: {theme}</Text>
      <Text onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </Text>
    </Box>
  );
}
```

## Navigation Patterns

### Breadcrumb Navigation

```tsx
import { useUrl } from '@idlesummer/pen';
import { Box, Text } from 'ink';

export function Breadcrumb() {
  const url = useUrl();
  const segments = url.split('/').filter(Boolean);

  return (
    <Box gap={1}>
      <Text color="blue">Home</Text>
      {segments.map((segment, i) => (
        <Box key={i} gap={1}>
          <Text dimColor>›</Text>
          <Text color="blue">{segment}</Text>
        </Box>
      ))}
    </Box>
  );
}

// Use in layout
export default function RootLayout({ children }) {
  return (
    <Box flexDirection="column">
      <Breadcrumb />
      {children}
    </Box>
  );
}
```

### Back/Forward Controls

```tsx
import { useHistory } from '@idlesummer/pen';
import { Box, Text } from 'ink';

export function HistoryNav() {
  const { position, history, back, forward } = useHistory();

  const canGoBack = position > 0;
  const canGoForward = position < history.length - 1;

  return (
    <Box gap={2}>
      <Text
        color={canGoBack ? 'cyan' : 'gray'}
        onPress={canGoBack ? back : undefined}
      >
        ← Back
      </Text>
      <Text dimColor>
        {position + 1} / {history.length}
      </Text>
      <Text
        color={canGoForward ? 'cyan' : 'gray'}
        onPress={canGoForward ? forward : undefined}
      >
        Forward →
      </Text>
    </Box>
  );
}
```

### Tab Navigation

```tsx
import { useUrl, useNavigate } from '@idlesummer/pen';
import { Box, Text } from 'ink';

interface Tab {
  label: string;
  url: string;
}

const tabs: Tab[] = [
  { label: 'Overview', url: '/dashboard' },
  { label: 'Analytics', url: '/dashboard/analytics' },
  { label: 'Reports', url: '/dashboard/reports' },
];

export function TabNav() {
  const currentUrl = useUrl();
  const { push } = useNavigate();

  return (
    <Box gap={2}>
      {tabs.map(tab => {
        const isActive = currentUrl === tab.url || currentUrl.startsWith(tab.url);
        return (
          <Text
            key={tab.url}
            color={isActive ? 'cyan' : undefined}
            backgroundColor={isActive ? 'blue' : undefined}
            onPress={() => push(tab.url)}
          >
            {tab.label}
          </Text>
        );
      })}
    </Box>
  );
}
```

## UI Patterns

### Modal-Style Navigation

```tsx
// Main screen
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useNavigate } from '@idlesummer/pen';

export default function MainScreen() {
  const { push } = useNavigate();

  return (
    <Box flexDirection="column">
      <Text>Main Content</Text>
      <Text onPress={() => push('/settings')} color="blue">
        Open Settings
      </Text>
    </Box>
  );
}

// Settings as "modal"
import { Box, Text } from 'ink';
import { useNavigate } from '@idlesummer/pen';

export default function Settings() {
  const { back } = useNavigate();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      padding={2}
      alignItems="center"
      justifyContent="center"
    >
      <Text bold>Settings</Text>
      <Text>Some settings here...</Text>
      <Text onPress={back} color="red" marginTop={1}>
        [Close]
      </Text>
    </Box>
  );
}
```

### List with Selection

```tsx
import { useState } from 'react';
import { Box, Text } from 'ink';

interface Item {
  id: number;
  name: string;
}

const items: Item[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
];

export default function ItemList() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <Box flexDirection="column">
      {items.map(item => (
        <Text
          key={item.id}
          color={selected === item.id ? 'green' : undefined}
          backgroundColor={selected === item.id ? 'bgGreen' : undefined}
          onPress={() => setSelected(item.id)}
        >
          {selected === item.id ? '► ' : '  '}{item.name}
        </Text>
      ))}
    </Box>
  );
}
```

## Testing Patterns

### Testing Components with Router

```tsx
// Component to test
import { useUrl, useNavigate } from '@idlesummer/pen';

export function NavButton() {
  const url = useUrl();
  const { push } = useNavigate();

  return (
    <Text onPress={() => push('/about')}>
      Current: {url}
    </Text>
  );
}

// Test file
import { render } from 'ink-testing-library';
import { RouterProvider } from '@idlesummer/pen';
import { NavButton } from './NavButton';

test('NavButton shows current URL', () => {
  const { lastFrame } = render(
    <RouterProvider initialUrl="/home">
      <NavButton />
    </RouterProvider>
  );

  expect(lastFrame()).toContain('Current: /home');
});
```

## Performance Patterns

### Memoizing Expensive Components

```tsx
import { memo } from 'react';
import { Box, Text } from 'ink';

const ExpensiveList = memo(function ExpensiveList({ items }) {
  // Expensive rendering logic
  return (
    <Box flexDirection="column">
      {items.map(item => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </Box>
  );
});

export default function Screen() {
  const items = useFetchItems();

  return <ExpensiveList items={items} />;
}
```

### Lazy Data Loading

```tsx
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export default function DataScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await fetchData();
      setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return <Text>Data: {JSON.stringify(data)}</Text>;
}
```

## Tips and Tricks

### Organizing Shared Components

```
src/app/
├── _components/          # Not routed (underscore prefix)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Spinner.tsx
├── _hooks/               # Custom hooks
│   └── useKeypress.ts
├── _utils/               # Utilities
│   └── format.ts
├── layout.tsx
└── screen.tsx
```

### Route Groups (No URL Segment)

```
src/app/
├── (marketing)/          # Group without URL segment
│   ├── layout.tsx        # Shared marketing layout
│   ├── about/
│   │   └── screen.tsx    # URL: /about
│   └── contact/
│       └── screen.tsx    # URL: /contact
└── (app)/                # Group without URL segment
    ├── layout.tsx        # Shared app layout
    ├── dashboard/
    │   └── screen.tsx    # URL: /dashboard
    └── settings/
        └── screen.tsx    # URL: /settings
```

Parentheses in folder names mean "group these routes but don't add this to the URL".

---

For more examples, check the `examples/` directory in the repository.
