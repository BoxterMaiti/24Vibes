import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Ensure environment variables are replaced at build time
    rollupOptions: {
      output: {
        // Use a more aggressive mangling strategy to obfuscate sensitive values
        mangleProps: /^_/,
        format: 'es'
      }
    }
  }
});