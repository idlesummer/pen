import { mount } from './.pen/generated/entry.ts'
import { componentMap } from './.pen/generated/component-map.ts'

const routes = Object.keys(componentMap.page)
  .map(path => '/' + path.replace(/(^|\/)page\.tsx$/, ''))
  .sort()
console.log('Routes:', routes)

const { waitUntilExit } = mount()
await waitUntilExit()
