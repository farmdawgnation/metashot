import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';

export default [
  eslint.configs.recommended,
  jest.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        Buffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        ...tseslint.configs.recommended.globals,
        ...eslint.configs.recommended.globals,
        node: true,
        jest: true,
        es2022: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      jest,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
];