import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.ts', '*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        Bun: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/parameter-properties': 'error',
      'no-console': 'off',
      'no-restricted-syntax': [
        'error',
        { selector: 'ImportExpression', message: 'Dynamic imports are forbidden; use a top-level import.' },
        { selector: 'TSImportType', message: 'Inline type imports are forbidden; use a top-level type import.' },
        { selector: 'TSEnumDeclaration', message: 'Enums require runtime emit; use an erasable const object and union type.' },
        { selector: 'TSModuleDeclaration', message: 'Namespaces/modules are forbidden; use ES modules.' },
        { selector: 'TSImportEqualsDeclaration', message: 'Import-equals is forbidden; use an ES module import.' },
        { selector: 'TSExportAssignment', message: 'Export-assignment is forbidden; use an ES module export.' },
        { selector: 'TSParameterProperty', message: 'Parameter properties are forbidden; declare and assign fields explicitly.' },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { jsdoc },
    rules: {
      ...jsdoc.configs['flat/recommended-typescript-error'].rules,
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: { esm: true, cjs: false },
        require: {
          ArrowFunctionExpression: false,
          ClassDeclaration: true,
          ClassExpression: true,
          FunctionDeclaration: true,
          FunctionExpression: false,
          MethodDefinition: true,
        },
        contexts: [
          'ExportNamedDeclaration > TSInterfaceDeclaration',
          'ExportNamedDeclaration > TSTypeAliasDeclaration',
        ],
      }],
    },
  },
);
