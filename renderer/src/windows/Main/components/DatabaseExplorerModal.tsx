import { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

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
			const info = await db.info()
			setDbInfo(info)

			const result = await db.allDocs({ include_docs: true })
			setAllDocs(result.rows)

			console.log('Database name:', db.name)
		} catch (err) {
			console.error('Failed to load database info:', err)
		} finally {
			setLoading(false)
		}
	}

	const deleteDoc = async (docId: string) => {
		try {
			const doc = await db.get(docId)
			await db.remove(doc)
			loadData() // Refresh
		} catch (err) {
			console.error('Failed to delete document:', err)
		}
	}

	if (!isOpen) return null

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content database-explorer-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>Database Explorer</h2>
					<button className="modal-close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					{loading ? (
						<div className="loading-container">
							<p>Loading database information...</p>
						</div>
					) : (
						<>
							{dbInfo && (
								<div className="db-info-section">
									<h3>Database Information</h3>
									<div className="db-info">
										<div className="info-item">
											<strong>Name:</strong> {dbInfo.db_name}
										</div>
										<div className="info-item">
											<strong>Documents:</strong> {dbInfo.doc_count}
										</div>
										<div className="info-item">
											<strong>Size:</strong> {Math.round(dbInfo.data_size / 1024)}KB
										</div>
									</div>
								</div>
							)}

							<div className="documents-section">
								<div className="section-header">
									<h3>All Documents ({allDocs.length})</h3>
									<button className="refresh-btn" onClick={loadData}>
										<i className="fas fa-sync-alt"></i> Refresh
									</button>
								</div>

								{allDocs.length === 0 ? (
									<p className="no-documents">No documents found.</p>
								) : (
									<div className="documents-list">
										{allDocs.map((row, index) => (
											<div key={row.id} className="document-item">
												<div className="document-header">
													<strong className="document-title">
														Document {index + 1}: {row.id}
													</strong>
													<button
														className="delete-btn"
														onClick={() => deleteDoc(row.id)}
														title="Delete document"
													>
														<i className="fas fa-trash"></i>
													</button>
												</div>
												<pre className="document-content">
													{JSON.stringify(row.doc, null, 2)}
												</pre>
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
