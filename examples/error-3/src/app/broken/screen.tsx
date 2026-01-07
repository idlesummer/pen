import { Text } from 'ink'

export default function BrokenScreen() {
  throw new Error('This screen intentionally crashes!')
  return <Text>You will never see this</Text>
}
