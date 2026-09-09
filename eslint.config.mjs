import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  { ignores: ['.next/**', 'node_modules/**', 'src/db/migrations/**'] },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      // Reverse-tabnabbing: an external link opened in a new tab must not hand the
      // opener reference to the destination.
      'react/jsx-no-target-blank': ['error', { allowReferrer: false, enforceDynamicLinks: 'always' }],
    },
  },

  {
    /**
     * Layering rule: the presentation layer never reaches the database directly.
     * Components and feature modules receive data as props from a page/route handler,
     * which is the only place allowed to call a service or repository.
     *
     * This complements — but does not replace — the `server-only` package, which is
     * what actually makes a client-bundle import of a server module a build error.
     */
    files: ['src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db', '@/db/*', '@/server/repositories/*'],
              message:
                'UI code must not access the database directly. Fetch in a Server Component, Server Action or route handler and pass the result down as props.',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
