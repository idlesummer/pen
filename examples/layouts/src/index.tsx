import React from 'react'
import { render } from 'ink'
import { Router } from '../../../dist/router'
import type { RouteManifest } from '../../../dist/build'

// Import your components
import RootLayout from './app/layout'
import AuthLayout from './app/(auth)/layout'
import LoginScreen from './app/(auth)/login/screen'
import SignupScreen from './app/(auth)/signup/screen'
import HomeScreen from './app/home/screen'
import type { ComponentType } from 'react'

// Inline manifest (temporary)
const manifest: RouteManifest = {
  '/login/': {
    url: '/login/',
    screen: '/app/(auth)/login/screen.tsx',
    layouts: ['/app/(auth)/layout.tsx', '/app/layout.tsx'],
  },
  '/signup/': {
    url: '/signup/',
    screen: '/app/(auth)/signup/screen.tsx',
    layouts: ['/app/(auth)/layout.tsx', '/app/layout.tsx'],
  },
  '/home/': {
    url: '/home/',
    screen: '/app/home/screen.tsx',
    layouts: ['/app/layout.tsx'],
  },
}

// Create component map
const components = {
  '/app/layout.tsx': RootLayout,
  '/app/(auth)/layout.tsx': AuthLayout,
  '/app/(auth)/login/screen.tsx': LoginScreen,
  '/app/(auth)/signup/screen.tsx': SignupScreen,
  '/app/home/screen.tsx': HomeScreen,
} as unknown as Record<string, ComponentType>

function App() {
  const url = process.argv[2] || '/logi/'
  return (
    <Router 
      url={url} 
      manifest={manifest} 
      components={components} 
    />
  )
}

render(<App />)
