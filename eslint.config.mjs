import globals from 'globals'
import pluginJs from '@eslint/js'

export default [
  {
    files: ['eslint.config.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2021,
    },
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    files: ['**/*.js'],
    env:{
      'node': true,
      'commonjs': true,
    },
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2021,
    },
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      'no-unused-vars': ['error', { 
        vars: 'all', 
        args: 'after-used', 
        ignoreRestSiblings: true,
        caughtErrors: 'none',
        argsIgnorePattern: '_',
      }],
    },
  },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
]
