# media/

To regenerate `demo.gif`:

1. `npm run build -w packages/pen`

2. `ren node_modules\react-devtools-core react-devtools-core.off`

   This hides it from Ink's devtools-connect check, so `pen dev` doesn't print
   a "React DevTools server not running" warning into the recording

3. `vhs media/demo.tape`

4. `ren node_modules\react-devtools-core.off react-devtools-core`

Then bump the `?v=N` query string on the README's image link.
