import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { compression } from 'vite-plugin-compression2'
import { ViteMinifyPlugin } from 'vite-plugin-minify'
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'
import svgrPlugin from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    TanStackRouterVite(),
    svgrPlugin(),
    ViteMinifyPlugin({}),
    compression(),
    obfuscatorPlugin({
      include: [
        'src/plugins/*.ts',
        'src/config/*.ts',
        'src/utils/helper/*.ts',
        'src/hooks/**/*.ts',
        'src/stores/*.ts',
        'src/components/**/*.ts',
      ],
      exclude: [/node_modules/],
      apply: 'build',
      debugger: true,
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 1,
        identifierNamesGenerator: 'hexadecimal',
        debugProtection: true,
        debugProtectionInterval: 4000,
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['rc4'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 5,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 5,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 1,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      },
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, './src'),
    },
  },
})
