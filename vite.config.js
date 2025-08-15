import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          games: [
            './src/DailyCrossword.jsx',
            './src/DailySudoku.jsx',
            './src/crosswordData.js',
            './src/sudokuRotation.js'
          ],
          utils: [
            './src/analytics.js',
            './src/puzzleRotation.js',
            './src/hangmanRotation.js'
          ]
        },
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline small assets as base64
    cssCodeSplit: true, // Split CSS into separate files
    sourcemap: false, // Disable sourcemaps in production
    // Target modern browsers for smaller bundles
    target: 'es2015'
  },
  // Optimize development server
  server: {
    hmr: {
      overlay: false // Disable error overlay for better performance
    }
  },
  // Enable CSS optimization
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false // Remove charset declaration for smaller CSS
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env']
  }
})
