// examples/kitchen-sink/src/app/users/screen.tsx
import { Box, Text } from 'ink'
import { USERS } from '../_private/routes'

export default function UsersScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>User List</Text>
      <Text dimColor>Press [7] to view /users/42, or navigate to /users/[id] directly.</Text>
      <Box flexDirection="column">
        {USERS.map(u => (
          <Text key={u.id}>  {u.id}: {u.name}</Text>
        ))}
      </Box>
    </Box>
  )
}
