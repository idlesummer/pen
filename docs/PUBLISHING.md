# Publishing to npm

Quick reference for publishing this package to npm.

## First Time Setup

1. **Create npm account** (if you don't have one)
   - Go to https://npmjs.com/signup
   - Enable 2FA in settings (recommended)

2. **Login from terminal**
   ```bash
   npm login
   ```

## Publishing Steps

```bash
# 1. Make sure everything is ready
git status          # Should be clean
npm test           # Should pass

# 2. Bump version (choose one)
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)

# Or set specific version
npm version 0.1.0

# 3. Push to GitHub
git push --follow-tags

# 4. Publish to npm
npm publish --access public
```

## After Publishing

Check it worked:
```bash
npm view @idlesummer/<project>
```

Your package is now live at:
- npm: `https://npmjs.com/package/@idlesummer/<project>`
- Install: `npm install @idlesummer/<project>`

## Common Issues

**"You cannot publish over previously published versions"**
- You're trying to publish a version that already exists
- Bump the version number: `npm version patch`

**"You must verify your email"**
- Check your email and verify your npm account

**"402 Payment Required"**
- You forgot `--access public`
- Scoped packages are private (paid) by default

**"403 Forbidden"**
- Not logged in: `npm login`
- Don't have permission for that package name

## Quick Commands

```bash
# Check current version
npm version

# See what would be published (dry run)
npm pack --dry-run

# Check if you're logged in
npm whoami

# Check if package name is available
npm view @idlesummer/<project>  # Should 404 if available
```

## Version Numbering

Follow semantic versioning (semver):

- **Patch** (1.0.0 → 1.0.1): Bug fixes, no API changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

For pre-release versions:
```bash
npm version 0.1.0    # Still in development
npm version 1.0.0    # First stable release
```

---

**Pro tip:** Don't publish on every commit. Only publish when you have something worth releasing!
