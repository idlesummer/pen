import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

const eslintConfig = [
  // Pre-packaged configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  
  // Project setup and personal preferences
  {
    languageOptions: { globals: globals.node },
    plugins: { 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      // React Hooks
      ...reactHooks.configs.recommended.rules,
      
      // Framework preferences
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/prop-types': 'off',
      
      // Personal style
      'comma-dangle': ['warn', 'always-multiline'],
      'eol-last': ['warn', 'always'],
      'jsx-quotes': ['warn', 'prefer-double'],
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'never'],
    },
  },
  
  // Ignores
  { ignores: ['node_modules/**', 'dist/**'] },
]

export default eslintConfig
