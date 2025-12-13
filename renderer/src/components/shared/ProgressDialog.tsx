import Modal, { modalStyles } from './Modal'

interface ProgressDialogProps {
	isOpen: boolean
	title: string
	message: string
	progressText: string
	onCancel: () => void
	isCancellable?: boolean
}

export default function ProgressDialog({
	isOpen,
	title,
	message,
	progressText,
	onCancel,
	isCancellable = true,
}: ProgressDialogProps) {
	const footerButtons = (
		<>
			<button
				type="button"
				className={modalStyles.secondaryButton}
				onClick={onCancel}
				disabled={!isCancellable}
				style={{
					opacity: isCancellable ? 1 : 0.6,
					cursor: isCancellable ? 'pointer' : 'not-allowed',
				}}
			>
				Cancel
			</button>
		</>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={onCancel}
			title={title}
			size="small"
			footer={footerButtons}
		>
			<p style={{ marginTop: 0 }}>{message}</p>
			<pre className={modalStyles.codeBlock} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
				{progressText}
			</pre>
		</Modal>
	)
}
