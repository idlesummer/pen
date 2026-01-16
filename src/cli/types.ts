export type CLICommand = {
  name: string
  desc: string
  action: () => void | Promise<void>
}
