# @workspace/lint

Shared Biome linting and formatting configuration for the big-ocean monorepo.

This package provides a centralized, consistent linting and formatting configuration for all apps and packages in the monorepo. It eliminates tooling inconsistency and ensures uniform code quality standards across the entire project.

## Features

- ✅ Single linting tool (Biome) across all packages
- ✅ Unified configuration with per-package customization support
- ✅ Strict accessibility rules (a11y compliance)
- ✅ Type-safe linting (noExplicitAny errors)
- ✅ Exhaustive dependency checking for hooks
- ✅ Automatic code formatting
- ✅ Git integration (VCS-aware)

## Installation

This package is managed by pnpm workspaces and is automatically available to all packages and apps in the monorepo.

### For Apps/Packages Using This Config

Add to your package's `devDependencies`:

```bash
pnpm add -D @biomejs/biome
```

No need to add @workspace/lint directly - it's referenced through the extends mechanism.

## Configuration

### Basic Setup (apps/front example)

Create a `biome.json` file in your app/package root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.4/schema.json",
  "root": false,
  "extends": ["@workspace/lint/biome"],
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

### With Customization (apps/api example)

You can extend the shared config and override specific rules:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.4/schema.json",
  "root": false,
  "extends": ["@workspace/lint/biome"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"
      }
    }
  }
}
```

### Key Configuration Fields

- **root**: `false` for non-root configs (packages inherit from shared config)
- **extends**: Reference to shared config `["@workspace/lint/biome"]`
- **linter**: Override specific rules while inheriting others
- **formatter**: Customize formatting (tab style, line width, etc.)
- **vcs**: Git integration for smart file selection during linting

## Usage

### Lint Files

```bash
# Lint all files in your app/package
pnpm lint

# Lint specific directory
biome lint src/

# Check specific file
biome lint src/components/Button.tsx
```

### Format Code

```bash
# Format all files
pnpm format

# Format specific files
biome format src/components/*.tsx
```

### Fix Linting Errors

```bash
# Auto-fix errors (use carefully, review changes)
biome lint --fix src/
```

### Root-Level Commands

```bash
# Lint entire monorepo (all apps/packages)
pnpm lint

# Format entire monorepo
pnpm format

# Lint specific app
pnpm lint --filter=front
pnpm lint --filter=api
```

## Rules Reference

The shared configuration enforces:

### Correctness
- No unused variables (warn)
- No unreachable code (error)
- Exhaustive dependencies for React hooks (error)
- No constant conditions (error)

### Accessibility (a11y)
- Button type attributes required (error)
- Valid ARIA attributes (error)
- Image alt text required (error)
- Valid heading content (error)
- Form labels required (error)

### Type Safety
- No explicit `any` types (error)
- Proper null checking (error)
- Type narrowing required (error)
- No unnecessary non-null assertions (warn)

### Style
- Use const for non-reassigned variables (warn)
- Use template literals where appropriate (warn)
- Collapsed else-if statements (warn)
- Consistent naming conventions (error)

### JavaScript/TypeScript
- Double quotes (style)
- Tab indentation (style)
- Trailing commas in all (multiline)
- Always semicolons (style)
- Arrow functions with parentheses (style)

## Migration from ESLint

If migrating from ESLint:

1. **Remove ESLint dependencies**:
   ```bash
   pnpm remove eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```

2. **Delete ESLint config files**:
   ```bash
   rm .eslintrc.js .eslintrc.json .eslintignore
   ```

3. **Add biome.json**:
   - Copy template above and customize as needed

4. **Add Biome dependency**:
   ```bash
   pnpm add -D @biomejs/biome
   ```

5. **Update package.json lint script**:
   ```json
   {
     "scripts": {
       "lint": "biome lint .",
       "format": "biome format ."
     }
   }
   ```

6. **Test linting**:
   ```bash
   pnpm lint
   ```

## Customization Guide

### Disable a Rule for Specific File

Add comment at top of file:

```typescript
// biome-ignore lint/suspicious/noExplicitAny: Legacy code, TODO refactor
export function legacyFunction(data: any) {
  // ...
}
```

### Disable a Rule for Block

```typescript
function MyComponent() {
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional pattern
  useEffect(() => {
    console.log("This is a controlled side effect")
  }, [])
}
```

### Override Rule in Package Config

Create `biome.json` in package with custom rules:

```json
{
  "extends": ["@workspace/lint/biome"],
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  }
}
```

## Troubleshooting

### "Cannot find module @workspace/lint"

Make sure `packages/lint` is installed:
```bash
pnpm install
```

### Rules Too Strict

Review the rule in your package's `biome.json` and adjust severity or disable if needed.

### Formatting Conflicts

If your IDE auto-formats differently:
- Make sure VSCode has Biome extension installed
- Set Biome as default formatter: `formatOnSave: true` in settings
- Or run `pnpm format` before committing

## CI/CD Integration

The GitHub Actions workflow automatically runs linting:

```yaml
- name: Lint code
  run: pnpm lint
```

All packages are linted, and any errors fail the build.

## See Also

- [Biome Documentation](https://biomejs.dev)
- [Biome Configuration Reference](https://biomejs.dev/reference/configuration/)
- [Biome Linter Rules](https://biomejs.dev/reference/rules/)
- [CLAUDE.md](../../CLAUDE.md) - Project documentation
