import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Базовая конфигурация: рекомендованные правила + хуки React. Правила, которые на текущем коде дают
// много срабатываний, понижены до предупреждений — их можно ужесточать постепенно.
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'docs', 'scripts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      // Правила «React Compiler» из react-hooks 7 срабатывают на привычный шаблон «загрузка данных в effect»;
      // пока это предупреждения, а не ошибки сборки.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/purity': 'warn',
      'no-irregular-whitespace': ['error', { skipRegExps: true, skipStrings: true }], // в phone.ts намеренно есть NBSP
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
