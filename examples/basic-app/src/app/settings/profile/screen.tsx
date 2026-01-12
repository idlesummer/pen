// examples/router-2/src/app/settings/profile/screen.tsx
import { Box, Text } from 'ink'

export default function ProfileScreen() {
  return (
    <Box flexDirection="column">
      <Text bold>User Profile</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>Name: John Doe</Text>
        <Text>Email: john@example.com</Text>
        <Text>Role: Developer</Text>
      </Box>
    </Box>
  )
}
