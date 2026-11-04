# Contributing

## Notes on Dependencies

### react-devtools electron override

Root `package.json` overrides `react-devtools`'s `electron` dependency to
`^42.11.3`. `react-devtools@8.0.0` depends on `electron@23.3.13`, which
fails to install on Node 24.16+/26.1+ due to a bug in the old `extract-zip`
dependency ([electron/electron#51619](https://github.com/electron/electron/issues/51619)).
`^42.11.3` replaced `extract-zip` with an internal fork, fixing it.

Remove this override once `react-devtools` bumps its own `electron`
dependency past the fix.
