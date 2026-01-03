import pc from 'picocolors'

export function info(message: string) {
  console.log(pc.bgBlue(pc.white(' INFO ')), message)
}

export function success(message: string) {
  console.log(pc.bgGreen(pc.white(' SUCCESS ')), message)
}

export function error(message: string) {
  console.log(pc.bgRed(pc.white(' ERROR ')), message)
}

export function warn(message: string) {
  console.log(pc.bgYellow(pc.white(' WARN ')), message)
}
