import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'public/assets/vendor/**', 'public/assets/css/**', 'public/assets/fonts/**'],
  },
  js.configs.recommended,
  {
    files: ['public/assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        SplitText: 'readonly',
        DrawSVGPlugin: 'readonly',
        Lenis: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
];
