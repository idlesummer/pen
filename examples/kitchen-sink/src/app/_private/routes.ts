// examples/kitchen-sink/src/app/_private/routes.ts
// This file is in a _private/ directory — it is ignored by the pen router
// and will never become a route. Use it for shared data, utilities, etc.

export const ROUTES = [
  { key: '[1]', path: '/',              desc: 'Home (screen.tsx + error.tsx + not-found.tsx)' },
  { key: '[2]', path: '/about/',        desc: 'About (plain screen)' },
  { key: '[3]', path: '/history/',      desc: 'useHistory demo  (inside (demos)/ group)' },
  { key: '[4]', path: '/memory/',       desc: 'useMemoryMonitor demo' },
  { key: '[5]', path: '/search-params/', desc: 'useSearchParams demo (pass data via push)' },
  { key: '[6]', path: '/users/',        desc: 'Users list (nested layout)' },
  { key: '[7]', path: '/users/42/',     desc: 'Dynamic [id] + useParams + useSearchParams' },
]

export const USERS = [
  { id: '1',  name: 'Alice',   email: 'alice@example.com' },
  { id: '42', name: 'Bob',     email: 'bob@example.com' },
  { id: '99', name: 'Charlie', email: 'charlie@example.com' },
]
