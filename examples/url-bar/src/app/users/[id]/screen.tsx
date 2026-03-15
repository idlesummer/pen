import { Box, Text } from 'ink'
import { useParams } from '@idlesummer/pen'

export default function UserScreen() {
  const { id } = useParams()

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="magenta">User Profile</Text>
      <Box>
        <Text dimColor>id:  </Text>
        <Text bold>{id}</Text>
      </Box>
      <Text dimColor>Try /users/bob/ or /users/99/ to see the param change.</Text>
    </Box>
  )
}
