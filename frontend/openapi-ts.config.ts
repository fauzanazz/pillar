import { defineConfig } from '@hey-api/openapi-ts';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  input: `${process.env.NEXT_PUBLIC_BASE_URL}/openapi.json`,
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/api/',
  },
  plugins: [
    '@hey-api/client-axios',
    '@hey-api/schemas',
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      enums: 'javascript',
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      transformer: true,
    },
  ],
});
