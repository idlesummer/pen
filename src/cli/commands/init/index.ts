import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import pc from 'picocolors'

import { CLI_NAME, PACKAGE_NAME } from '@/pen/constants'
import type { CLICommand } from '../../types'

export const init: CLICommand = {
  name: 'init',
  desc: 'Initialize a new Pen project',
  action: async () => {
    console.log(pc.cyan(`\n  Initializing ${CLI_NAME} project...\n`))

    // Check if already initialized
    if (existsSync('pen.config.ts')) {
      console.error(pc.yellow('⚠') + ' Project already initialized')
      console.error(pc.dim('  pen.config.ts already exists'))
      return
    }

    // Create pen.config.ts
    const configContent = [
      `import { defineConfig } from '${PACKAGE_NAME}'`,
      '',
      'export default defineConfig({',
      '  appDir: \'./src/app\',',
      '  outDir: \'./.pen\',',
      '})',
      '',
    ].join('\n')

    await writeFile('pen.config.ts', configContent, 'utf-8')
    console.log(pc.green('✓') + ' Created pen.config.ts')

    // Create src/app directory
    const appDir = './src/app'
    await mkdir(appDir, { recursive: true })

    // Create layout.tsx
    const layoutContent = [
      'import { Box, Text } from \'ink\'',
      'import type { ReactNode } from \'react\'',
      '',
      'export default function Layout({ children }: { children?: ReactNode }) {',
      '  return (',
      '    <Box flexDirection="column" padding={1}>',
      '      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={2}>',
      '        <Text bold color="cyan">Welcome to Pen</Text>',
      '      </Box>',
      '      {children}',
      '    </Box>',
      '  )',
      '}',
      '',
    ].join('\n')

    await writeFile(join(appDir, 'layout.tsx'), layoutContent, 'utf-8')
    console.log(pc.green('✓') + ' Created src/app/layout.tsx')

    // Create screen.tsx
    const screenContent = [
      'import { useState } from \'react\'',
      'import { Box, Text, useInput } from \'ink\'',
      '',
      'export default function Screen() {',
      '  const [count, setCount] = useState(0)',
      '',
      '  useInput((input) => {',
      '    if (input === \' \') setCount(c => c + 1)',
      '  })',
      '',
      '  return (',
      '    <Box flexDirection="column" gap={1}>',
      '      <Box>',
      '        <Text>Count: <Text bold color="green">{count}</Text></Text>',
      '      </Box>',
      '      <Box>',
      '        <Text dimColor>Press <Text bold>SPACE</Text> to increment</Text>',
      '      </Box>',
      '    </Box>',
      '  )',
      '}',
      '',
    ].join('\n')

    await writeFile(join(appDir, 'screen.tsx'), screenContent, 'utf-8')
    console.log(pc.green('✓') + ' Created src/app/screen.tsx')

    // Success message with instructions
    console.log()
    console.log(pc.green('✓') + ' Project initialized!')
    console.log()
    console.log(pc.bold('  Next steps:'))
    console.log()
    console.log(pc.dim('  1. Add scripts to package.json:'))
    console.log()
    console.log('     {')
    console.log('       "scripts": {')
    console.log(`         "build": "${CLI_NAME} build",`)
    console.log(`         "start": "${CLI_NAME} start"`)
    console.log('       }')
    console.log('     }')
    console.log()
    console.log(pc.dim('  2. Run "npm run build" to build your app'))
    console.log(pc.dim('  3. Run "npm run start" to start your app'))
    console.log()
  },
}
