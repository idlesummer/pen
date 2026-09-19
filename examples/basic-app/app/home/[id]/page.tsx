import { Text } from 'ink'
import type { ParamTable } from '@idlesummer/pen'

export default function HomeItemPage({ params }: { params: ParamTable }) {
  return (
    <>
      <Text>Hello World from </Text>
      <Text color="green" bold>HomeItemPage</Text>
      <Text color="yellow">{'\n'}param.id: {params.id}</Text>
    </>
  )
}
