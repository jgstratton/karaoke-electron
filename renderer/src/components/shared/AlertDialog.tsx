import Modal, { modalStyles } from './Modal'

interface AlertDialogProps {
	isOpen: boolean
	title: string
	message: string
	cancelText?: string
	onCancel: () => void
	isDestructive?: boolean
}

export default function AlertDialog({
	isOpen,
	title,
	message,
	cancelText = 'Cancel',
	onCancel,
	isDestructive = false
}: AlertDialogProps) {
	const footerButtons = (
		<>
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
