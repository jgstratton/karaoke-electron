import { ReactNode } from 'react'
import modalStyles from './Modal.module.css'

export interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	size?: 'small' | 'medium' | 'large' | 'xlarge'
	fullHeight?: boolean
	children: ReactNode
	footer?: ReactNode
}

export default function Modal({
	isOpen,
	onClose,
	title,
	size = 'medium',
	fullHeight = false,
	children,
	footer
}: ModalProps) {
	if (!isOpen) return null

	const sizeClass = modalStyles[size]
	const heightClass = fullHeight ? modalStyles.fullHeight : ''

	return (
		<div className={modalStyles.overlay} onClick={onClose}>
			<div
				className={`${modalStyles.content} ${sizeClass} ${heightClass}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={modalStyles.header}>
					<h2>{title}</h2>
					<button className={modalStyles.closeBtn} onClick={onClose}>
						×
					</button>
				</div>

				<div className={modalStyles.body}>
					{children}
				</div>

				{footer && (
					<div className={modalStyles.footer}>
						{footer}
					</div>
				)}
			</div>
		</div>
	)
}

// Export modal styles for components that need custom layouts
export { modalStyles }
