import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@paginas': path.resolve(__dirname, './src/paginas'),
      '@componentes': path.resolve(__dirname, './src/componentes'),
      '@compartido': path.resolve(__dirname, './src/compartido'),
      '@nucleo': path.resolve(__dirname, './src/nucleo'),
      '@recursos': path.resolve(__dirname, './src/recursos'),
      // Retrocompatibilidad temporal
      '@pages': path.resolve(__dirname, './src/paginas'),
      '@features': path.resolve(__dirname, './src/componentes'),
      '@shared': path.resolve(__dirname, './src/compartido'),
      '@core': path.resolve(__dirname, './src/nucleo'),
      '@assets': path.resolve(__dirname, './src/recursos'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'recharts'],
        },
      },
    },
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
})
