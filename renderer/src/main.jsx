import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Polyfill for libraries expecting Node.js globals
if (typeof global === 'undefined') {
	window.global = window.globalThis || window
}

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
