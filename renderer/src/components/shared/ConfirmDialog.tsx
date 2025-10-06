import Modal, { modalStyles } from './Modal'

interface ConfirmDialogProps {
	isOpen: boolean
	title: string
	message: string
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	onCancel: () => void
	isDestructive?: boolean
}

export default function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
	isDestructive = false
}: ConfirmDialogProps) {
	const footerButtons = (
		<>
			<button
				type="button"
				className={isDestructive ? modalStyles.deleteButton : modalStyles.primaryButton}
				onClick={onConfirm}
				autoFocus
			>
				{confirmText}
			</button>
			<button
				type="button"
				className={modalStyles.secondaryButton}
				onClick={onCancel}
			>
				{cancelText}
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
			<p>{message}</p>
		</Modal>
	)
}
