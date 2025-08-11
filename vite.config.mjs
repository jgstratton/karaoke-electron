import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
	root: 'renderer',
	plugins: [react()],
	base: './', // Ensure asset paths work with file:// protocol in production
	define: {
		global: 'window',
		'process.env': {},
	}, // Map Node's `global` to the browser's `globalThis`
	optimizeDeps: {
		include: ['pouchdb-browser'],
	},
	build: {
		outDir: '../dist',
		emptyOutDir: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
	server: {
		port: 5173,
		strictPort: true,
	},
	clearScreen: false,
})
