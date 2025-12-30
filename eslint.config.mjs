// import js from '@eslint/js'
// import tseslint from 'typescript-eslint'
// import react from 'eslint-plugin-react'
// import reactHooks from 'eslint-plugin-react-hooks'
// import globals from 'globals'

// const eslintConfig = tseslint.config(
//   // Pre-packaged configs
//   js.configs.recommended,
//   ...tseslint.configs.recommended,
//   react.configs.flat.recommended,
//   react.configs.flat['jsx-runtime'],
  
//   // Project setup
//   {
//     languageOptions: { globals: globals.node },
//     plugins: { 'react-hooks': reactHooks },
//     settings: { react: { version: 'detect' }},
//     rules: { ...reactHooks.configs.recommended.rules },
//   },
  
//   // Your personal style preferences
//   {
//     files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
//     rules: {
//       '@typescript-eslint/no-unused-vars': 'warn',
//       'react/prop-types': 'off',
//       'react/no-unescaped-entities': 'off',
//       'react/no-anonymous-default-export': 'error',
      
//       // Style
//       'comma-dangle': ['warn', 'always-multiline'],
//       'eol-last': ['warn', 'always'],
//       'jsx-quotes': ['warn', 'prefer-double'],
//       'object-curly-spacing': ['warn', 'always'],
//       'quotes': ['warn', 'single', { avoidEscape: true }],
//       'semi': ['warn', 'never'],
//     },
//   },
  
//   // Ignores
//   {
//     ignores: [
//       'node_modules/**',
//       'dist/**',
//     ],
//   }
// )

// export default eslintConfig
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

const eslintConfig = defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript recommended
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',

      // React recommended
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks
      ...reactHooksPlugin.configs.recommended.rules,

      // Custom style rules
      'comma-dangle': ['warn', 'always-multiline'],
      'eol-last': ['warn', 'always'],
      'jsx-quotes': ['warn', 'prefer-double'],
      'no-anonymous-default-export': 'error',
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'never'],
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
])
