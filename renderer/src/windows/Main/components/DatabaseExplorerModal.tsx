import { useEffect, useState } from 'react'
import Database from '@/database'
import modalStyles from '../../../components/shared/Modal.module.css'
import styles from './DatabaseExplorerModal.module.css'

interface DatabaseExplorerModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function DatabaseExplorerModal({ isOpen, onClose }: DatabaseExplorerModalProps) {
	const [dbInfo, setDbInfo] = useState<any>(null)
	const [allDocs, setAllDocs] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (isOpen) {
			loadData()
		}
	}, [isOpen])

	const loadData = async () => {
		try {
			setLoading(true)
			const info = await Database.info()
			setDbInfo(info)

			const result = await Database.allDocs({ include_docs: true })
			setAllDocs(result.rows)
		} catch (err) {
			console.error('Failed to load database info:', err)
		} finally {
			setLoading(false)
		}
	}

	const deleteDoc = async (docId: string, rev: string | undefined) => {
		try {
			if (!rev) {
				return
			}
			await Database.removeDoc(docId, rev)
			loadData() // Refresh
		} catch (err) {
			console.error('Failed to delete document:', err)
		}
	}

	if (!isOpen) return null

	return (
		<div className={modalStyles.overlay} onClick={onClose}>
			<div className={`${modalStyles.content} ${modalStyles.large}`} onClick={(e) => e.stopPropagation()}>
				<div className={modalStyles.header}>
					<h2>Database Explorer</h2>
					<button className={modalStyles.closeBtn} onClick={onClose}>
						×
					</button>
				</div>

				<div className={modalStyles.body}>
					{loading ? (
						<div className={modalStyles.loadingContainer}>
							<p>Loading database information...</p>
						</div>
					) : (
						<>
							{dbInfo && (
								<div className={modalStyles.infoSection}>
									<h3 className={modalStyles.sectionTitle}>Database Information</h3>
									<div className={styles.dbInfo}>
										<div className={styles.infoItem}>
											<strong>Name:</strong> {dbInfo.db_name}
										</div>
										<div className={styles.infoItem}>
											<strong>Documents:</strong> {dbInfo.doc_count}
										</div>
										<div className={styles.infoItem}>
											<strong>Size:</strong> {Math.round(dbInfo.data_size / 1024)}KB
										</div>
									</div>
								</div>
							)}

							<div>
								<div className={modalStyles.sectionHeader}>
									<h3 className={modalStyles.sectionTitle}>All Documents ({allDocs.length})</h3>
									<button className={modalStyles.primaryBtn} onClick={loadData}>
										<i className="fas fa-sync-alt"></i> Refresh
									</button>
								</div>

								{allDocs.length === 0 ? (
									<p className={modalStyles.noData}>No documents found.</p>
								) : (
									<div className={modalStyles.scrollableList}>
										{allDocs.map((row, index) => (
											<div key={row.id} className={modalStyles.listItem}>
												<div className={modalStyles.listItemHeader}>
													<strong className={modalStyles.listItemTitle}>
														Document {index + 1}: {row.id}
													</strong>
													<button
														className={modalStyles.dangerBtn}
														onClick={() => deleteDoc(row.id, row.doc?._rev)}
														title="Delete document"
													>
														<i className="fas fa-trash"></i>
													</button>
												</div>
												<div className={modalStyles.listItemContent}>
													<pre className={modalStyles.codeBlock}>
														{JSON.stringify(row.doc, null, 2)}
													</pre>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
