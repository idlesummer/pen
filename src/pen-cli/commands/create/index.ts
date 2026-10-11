import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineCommand } from 'citty'
import * as log from '@/pen-cli/logger/console'
import { scaffoldProject } from './scaffold'

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
    const targetDir = join(process.cwd(), args.name)
    if (existsSync(targetDir)) {
      log.error(`'${args.name}' already exists.`)
      process.exit(1)
    }

    await scaffoldProject(targetDir, args.name)

    log.ready(`Created ${args.name}`)
    log.event(`cd ${args.name} && npm install && npx pen dev`)
  },
})
