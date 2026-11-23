import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './base.js';

/** Config for the NestJS app. */
export default tseslint.config(...base, {
  languageOptions: {
    globals: { ...globals.node, ...globals.jest },
  },
  rules: {
    // Nest DI relies on runtime class references in constructor params
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
  },
});
