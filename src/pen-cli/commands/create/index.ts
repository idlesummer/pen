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

    if (isCurrentDir ? readdirSync(targetDir).length > 0 : existsSync(targetDir)) {
      log.error(`'${args.name}' already exists.`)
      process.exit(1)
    }
    const projectName = isCurrentDir ? basename(process.cwd()) : args.name
    await createProjectScaffold(targetDir, projectName)
    log.ready(`Created ${args.name}`)
    log.event(isCurrentDir ? `cd ${args.name} && ` : '' + 'npm install && npx pen dev')
  },
})
