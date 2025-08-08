import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    root: 'renderer',
    plugins: [react()],
    base: './', // Ensure asset paths work with file:// protocol in production
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    clearScreen: false,
});
