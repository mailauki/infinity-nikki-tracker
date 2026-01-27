import { defineConfig, globalIgnores } from 'eslint/config'

import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      '@next/next/no-page-custom-font': 'off',
      eqeqeq: 'warn',
      // 'no-unused-vars': 'error',
      'no-unassigned-vars': 'error',
      'vars-on-top': 'error',
      'prefer-spread': 'error',
      'prefer-object-spread': 'error',
      'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
      'no-unneeded-ternary': 'error',
      'no-nested-ternary': 'warn',
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
