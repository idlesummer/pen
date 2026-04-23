import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { dirname, join, resolve } from 'path'

type Node = {
  [name: string]: Node | null // null = file, object = directory
}

// Mock Next.js-like app/ tree covering every segment type in segment.ts:
//   static, group '(x)', dynamic '[id]', catchall '[...slug]', optional-catchall '[[...slug]]'.
// Also includes '_private' (underscore-prefixed, should be ignored by route.ts)
// and all four route module files (layout, page, error, not-found).
const mockTree: Node = {
  'layout.tsx': null,
  'page.tsx': null,
  'error.tsx': null,
  'not-found.tsx': null,

  'about': {
    'page.tsx': null,
  },

  'contact': {
    'layout.tsx': null,
    'page.tsx': null,
  },

  '(marketing)': {
    'pricing': {
      'page.tsx': null,
    },
    'features': {
      'page.tsx': null,
    },
  },

  'dashboard': {
    'layout.tsx': null,
    'page.tsx': null,
    'settings': {
      'page.tsx': null,
    },
  },

  'users': {
    'page.tsx': null,
    '[id]': {
      'page.tsx': null,
      'not-found.tsx': null,
      'posts': {
        '[postId]': {
          'page.tsx': null,
        },
      },
    },
  },

  'blog': {
    '[...slug]': {
      'page.tsx': null,
    },
  },

  'docs': {
    '[[...path]]': {
      'page.tsx': null,
    },
  },

  '_private': {
    'page.tsx': null,
    'secret': {
      'page.tsx': null,
    },
  },
}

function materialize(node: Node, basePath: string): void {
  mkdirSync(basePath, { recursive: true })
  for (const [name, child] of Object.entries(node)) {
    const childPath = join(basePath, name)
    if (child === null) {
      mkdirSync(dirname(childPath), { recursive: true })
      writeFileSync(childPath, '')
    } else {
      materialize(child, childPath)
    }
  }
}

const outPath = resolve(process.argv[2] ?? 'scripts/mock-app')
rmSync(outPath, { recursive: true, force: true })
materialize(mockTree, outPath)
console.log(`Mock app created at: ${outPath}`)
