import React from 'react'

interface ReduxStoreModalProps {
	isOpen: boolean
	onClose: () => void
	storeData: any
}

export default function ReduxStoreModal({ isOpen, onClose, storeData }: ReduxStoreModalProps) {
	const jsonString = JSON.stringify(storeData, null, 2)

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose()
		}
	}

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	const copyToClipboard = () => {
		navigator.clipboard.writeText(jsonString).then(() => {
			alert('Redux store copied to clipboard!')
		}).catch(() => {
			alert('Failed to copy to clipboard')
		})
	}

	if (!isOpen) return null

	return (
		<div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown} tabIndex={-1}>
			<div className="modal-content redux-store-modal">
				<div className="modal-header">
					<h2>Redux Store State</h2>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<button
							className="copy-btn"
							onClick={copyToClipboard}
							title="Copy to clipboard"
						>
							<i className="fas fa-copy"></i> Copy
						</button>
						<button className="modal-close-btn" onClick={onClose}>×</button>
					</div>
				</div>

				<div className="modal-body">
					<div className="json-viewer">
						<pre className="json-content">
							<code>{jsonString}</code>
						</pre>
					</div>
				</div>

				<div className="modal-footer">
					<button onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}
