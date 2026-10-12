import { existsSync, readdirSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
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
      description: 'Directory to create the project in (default: current directory)',
      valueHint: 'directory',
      required: false,
    },
  },
  run: async ({ args }) => {
    const targetDir = resolve(args.name ?? '.')
    const isCurrentDir = targetDir === process.cwd()
    const projectName = basename(targetDir)

    if (isCurrentDir ? readdirSync(targetDir).length > 0 : existsSync(targetDir)) {
      log.error(`'${projectName}' already exists.`)
      process.exit(1)
    }
    const projectDir = relative(process.cwd(), targetDir)
    const message = isCurrentDir
      ? 'npm install && npx pen dev'
      : `cd ${projectDir} && npm install && npx pen dev`

    await createProjectScaffold(targetDir, projectName)
    log.event(`Created project '${projectName}'`)
    log.event(`Get started: ${message}`)
  },
})
