import React from 'react';
import { render, Box, Text } from 'ink';
import type { Route } from '../cli/scanner.js';

interface AppProps {
  routes: Route[];
}

const App: React.FC<AppProps> = ({ routes }) => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🖊️  Pen Framework
        </Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text dimColor>
          Found {routes.length} route file{routes.length !== 1 ? 's' : ''} in src/app/
        </Text>
      </Box>
      
      {routes.length > 0 ? (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Routes:</Text>
          </Box>
          {routes.map((route, index) => (
            <Box key={route.path} marginLeft={2}>
              <Text color="green">
                {index + 1}. {route.path}
              </Text>
            </Box>
          ))}
        </Box>
      ) : (
        <Box>
          <Text color="yellow">
            No routes found. Create some files in src/app/ to get started!
          </Text>
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text dimColor>
          Press Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );
};

export async function startDevServer(routes: Route[]): Promise<void> {
  render(<App routes={routes} />);
}