import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['dist/**','delivery/**','node_modules/**'] }, ...tseslint.configs.recommended, { files: ['tests/**/*.ts'], rules: {'@typescript-eslint/no-explicit-any':'off'} });
