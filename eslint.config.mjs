import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**', 'doc/api.md'],
    },
    js.configs.recommended,
    prettier,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2025,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        },
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2025,
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
    },
];
