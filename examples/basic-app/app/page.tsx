import { useState } from 'react'
import { Text, useInput } from 'ink'

export default function HomePage() {
  const [value, setValue] = useState('')

  useInput((input, key) => {
    if (key.backspace || key.delete)
      setValue(current => current.slice(0, -1))
    else if (!key.return && !key.ctrl && !key.meta)
      setValue(current => current + input)
  })

  return <Text>Type something: {value}</Text>
}
