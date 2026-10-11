import { existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { defineCommand } from 'citty'
import * as log from '@/pen-cli/logger/console'
import { createProjectScaffold } from './scaffold'

export const createCommand = defineCommand({
  meta: {
    name: 'create',
    description: 'Scaffold a new pen project',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Directory to create the project in',
      valueHint: 'directory',
      required: true,
    },
  },
  run: async ({ args }) => {
    const isCurrentDir = args.name === '.'
    const targetDir = join(process.cwd(), args.name)
    const projectName = isCurrentDir ? basename(process.cwd()) : args.name

    if (isCurrentDir ? readdirSync(targetDir).length > 0 : existsSync(targetDir)) {
      log.error(`'${projectName}' already exists.`)
      process.exit(1)
    }
    const message = isCurrentDir
      ? 'npm install && npx pen dev'
      : `cd ${projectName} && npm install && npx pen dev`

    await createProjectScaffold(targetDir, projectName)
    log.ready(`Created '${projectName}'`)
    log.event(message)
  },
})
