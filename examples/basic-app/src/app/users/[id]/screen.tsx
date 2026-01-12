import React from 'react'
import { Box, Text } from 'ink'
import { useRouter } from '@idlesummer/pen'

export default function UserScreen() {
  const { params } = useRouter()
  const userId = params.id

  return (
    <Box flexDirection="column" gap={1}>
      <Text color="cyan" bold>User Profile</Text>
      <Box flexDirection="column">
        <Text>User ID: <Text color="green">{userId}</Text></Text>
        <Text>Name: John Doe</Text>
        <Text>Email: john@example.com</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>This is a dynamic route: /users/[id]</Text>
      </Box>
    </Box>
  )
}
