#!/usr/bin/env node

import { run } from './cli'

process.exit(await run(process.argv))
