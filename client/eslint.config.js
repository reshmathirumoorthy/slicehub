import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Classic data-fetching effects call setState; keep allowed for this app.
      'react-hooks/set-state-in-effect': 'off',
      // React Three Fiber uses non-DOM props on intrinsic elements.
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'args',
            'attach',
            'position',
            'rotation',
            'scale',
            'intensity',
            'castShadow',
            'receiveShadow',
            'roughness',
            'metalness',
            'transparent',
            'opacity',
            'groundColor',
            'shadow-mapSize',
            'shadow-bias',
            'object',
            'geometry',
            'material',
            'skeleton',
            'dispose',
            'map',
            'normalMap',
            'normalScale',
            'roughnessMap',
            'envMapIntensity',
            'angle',
            'penumbra',
            'transmission',
            'thickness',
            'color',
            'toneMappingExposure',
            'clearcoat',
            'clearcoatRoughness',
            'reflectivity',
            'side',
            'environmentIntensity',
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
];
