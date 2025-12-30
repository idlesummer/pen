import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

const eslintConfig = tseslint.config(
  // Pre-packaged configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  
  // Project setup
  {
    languageOptions: { globals: globals.node },
    plugins: { 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' }},
    rules: { ...reactHooks.configs.recommended.rules },
  },
  
  // Your personal style preferences
  {
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-anonymous-default-export': 'error',
      
      // Style
      'comma-dangle': ['warn', 'always-multiline'],
      'eol-last': ['warn', 'always'],
      'jsx-quotes': ['warn', 'prefer-double'],
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'never'],
    },
  },
  
  // Ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
    ],
  }
)

export default eslintConfig
