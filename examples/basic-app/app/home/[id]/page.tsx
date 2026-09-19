import { Text } from 'ink'
import type { ParamTable } from '@idlesummer/pen'

export default function HomeItemPage({ params }: { params: ParamTable }) {
  return (
    <>
      <Text>Hello World from HomeItemPage - id: </Text>
      <Text color="yellow">{params.id}</Text>
    </>
  )
}
