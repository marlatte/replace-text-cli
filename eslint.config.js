import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js, '@stylistic': stylistic },
    extends: ['js/recommended'],
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      'no-console': ['warn'],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.test.{js,mjs,cjs,ts,mts,cts}'],
    ...vitest.configs.recommended,
  },
  tseslint.configs.recommended,
  globalIgnores(['dist/']),
]);
