// examples/kitchen-sink/src/app/users/[id]/screen.tsx
// Demonstrates useParams (dynamic segment) + useSearchParams together
import { Box, Text } from 'ink'
import { useParams, useSearchParams } from '@idlesummer/pen'
import { USERS } from '../../_private/routes'

interface RouteParams {
  id: string
}

interface NavParams {
  role?: string
}

export default function UserDetailScreen() {
  const { id } = useParams() as RouteParams
  const navParams = useSearchParams() as NavParams
  const user = USERS.find(u => u.id === id)

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>User Detail</Text>
      <Box flexDirection="column">
        <Text dimColor>useParams:</Text>
        <Text>  id: <Text color="cyan">{id}</Text></Text>
      </Box>
      {user ? (
        <Box flexDirection="column">
          <Text>  name:  {user.name}</Text>
          <Text>  email: {user.email}</Text>
        </Box>
      ) : (
        <Text dimColor>  (user not found in local data)</Text>
      )}
      {navParams?.role && (
        <Box flexDirection="column">
          <Text dimColor>useSearchParams:</Text>
          <Text>  role: <Text color="yellow">{navParams.role}</Text></Text>
        </Box>
      )}
    </Box>
  )
}
