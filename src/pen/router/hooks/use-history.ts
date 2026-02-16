import { useRouter } from './use-router'

/**
 * Get the navigation history (URLs only)
 *
 * @returns readonly array of visited URLs
 *
 * @example
 * ```tsx
 * const history = useHistory()
 * return (
 *   <Box>
 *     <Text>Visited pages:</Text>
 *     {history.map((url, i) => (
 *       <Text key={i}>{url}</Text>
 *     ))}
 *   </Box>
 * )
 * ```
 */
export function useHistory(): readonly string[] {
  const { history } = useRouter()
  return history
}
