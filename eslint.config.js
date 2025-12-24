import eslint from '@eslint/js'
import react from '@eslint - plugin - react'
import reactHooks from '@eslint - plugin - react - hooks'

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'public',
    ],
  },
  {
    rules: {
      'no - console': 'error',
    }
  },
  eslint.configs.recommended,
  {
    plugins: {
      react,
      'react - hooks': reactHooks
    },
    rules: {
     ...react.configs.recommended.rules,
     ...reactHooks.configs.recommended.rules
    },
    settings: {
      react: {
        version:'detect'// 自动检测React版本
      }
    }
  }
];