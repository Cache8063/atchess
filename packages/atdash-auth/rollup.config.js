import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import { defineConfig } from 'rollup'

const external = [
  '@atproto/api',
  'vue',
  'broadcast-channel'
]

export default defineConfig([
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        rootDir: './src'
      })
    ]
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  },
  
  // UMD build for CDN usage
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/atdash-auth.umd.js',
      format: 'umd',
      name: 'AtdashAuth',
      sourcemap: true,
      globals: {
        '@atproto/api': 'AtprotoAPI',
        'vue': 'Vue',
        'broadcast-channel': 'BroadcastChannel'
      }
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  }
])