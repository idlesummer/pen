import pkg from '@/package.json' with { type: 'json' }

// Package metadata
export const PACKAGE_NAME = pkg.name as string
export const DESCRIPTION = pkg.description as string
export const PEN_VERSION = pkg.version as string
export const INK_VERSION = pkg.peerDependencies.ink as string
export const REACT_VERSION = pkg.peerDependencies.react as string
export const ESLINT_VERSION = pkg.peerDependencies.eslint as string
export const TYPES_NODE_VERSION = pkg.devDependencies['@types/node'] as string
export const TYPES_REACT_VERSION = pkg.devDependencies['@types/react'] as string
export const TYPESCRIPT_VERSION = pkg.devDependencies.typescript as string
