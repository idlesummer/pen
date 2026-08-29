#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import { CLI_NAME, DESCRIPTION, VERSION } from '@/lib/constants'
import { buildCommand } from '@/react/cli'

const main = defineCommand({
  meta: {
    name: CLI_NAME,
    version: VERSION,
    description: DESCRIPTION,
  },
  subCommands: {
    build: buildCommand,
  },
})

runMain(main)
