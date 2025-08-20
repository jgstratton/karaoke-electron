import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
	root: 'renderer',
	plugins: [react()],
	base: './', // Ensure asset paths work with file:// protocol in production
	define: {
		global: 'window',
		'process.env': {},
	}, // Map Node's `global` to the browser's `globalThis`
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './renderer/src'),
			'@/store': path.resolve(__dirname, './renderer/src/store'),
			'@/components': path.resolve(__dirname, './renderer/src/components'),
			'@/types': path.resolve(__dirname, './renderer/src/types'),
		},
	},
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
