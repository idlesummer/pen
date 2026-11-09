import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'

const RAW_BASE = 'https://raw.githubusercontent.com/idlesummer/pen/main/'

// Relative path is correct for GitHub, but npm doesn't reliably resolve
// it from a monorepo subdir, so rewrite to absolute here only.
const readme = readFileSync('../../README.md', 'utf8')
const newReadme = readme.replace('(media/demo.gif', `(${RAW_BASE}media/demo.gif`)

writeFileSync('README.md', newReadme)
copyFileSync('../../LICENSE', 'LICENSE')
