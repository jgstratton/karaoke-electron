import React from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'

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

	const copyToClipboard = () => {
		navigator.clipboard.writeText(jsonString).then(() => {
			alert('Redux store copied to clipboard!')
		}).catch(() => {
			alert('Failed to copy to clipboard')
		})
	}

	const footerButtons = (
		<>
			<button
				className={modalStyles.primaryBtn}
				onClick={copyToClipboard}
				title="Copy to clipboard"
			>
				<i className="fas fa-copy"></i> Copy
			</button>
			<button className={modalStyles.secondaryBtn} onClick={onClose}>
				Close
			</button>
		</>
	)

	return (
		<div onKeyDown={handleKeyDown} tabIndex={-1}>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title="Redux Store State"
				size="large"
				footer={footerButtons}
			>
				<pre className={modalStyles.codeBlock} style={{ maxHeight: '60vh' }}>
					<code>{jsonString}</code>
				</pre>
			</Modal>
		</div>
	)
}
