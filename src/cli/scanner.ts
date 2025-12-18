import fs from 'fs'
import path from 'path'


export type FsNode = {
  name: string
  path: string
  type: 'dir' | 'file'
  children?: FsNode[]
}

export function scanAppDir(appPath: string) {
  const absRoot = path.resolve(appPath)
  if (!fs.existsSync(absRoot)) 
    throw new Error(`scanAppDir: path does not exist: ${absRoot}`)

  const stat = fs.statSync(absRoot)
  if (!stat.isDirectory()) 
    throw new Error(`scanAppDir: expected directory, got file: ${absRoot}`)

  
}
