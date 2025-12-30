/**
 * Removes common leading whitespace from all lines in a template string.
 * Preserves relative indentation between lines.
 */
export function dedent(str: string) {
  const lines = str.split('\n')
  let minIndent = Infinity
  
  // Find minimum indent (skip empty lines)
  for (const line of lines) {
    if (!line.trim()) 
      continue
    
    let indent = 0
    while (indent < line.length && line[indent] === ' ') 
      indent++
    
    if (indent < minIndent) 
      minIndent = indent
  }
  
  // No indent found, return trimmed
  if (minIndent === Infinity) 
    return str.trim() + '\n'
  
  // Remove indent from all lines and rejoin
  const dedented = lines.map(line => line.slice(minIndent)).join('\n')
  return dedented.trim() + '\n'
}
