import { useEffect, useMemo, useState } from 'react'
import PouchDB from 'pouchdb-browser'
import modalStyles from '../../../components/shared/Modal.module.css'
import styles from './DatabaseExplorerModal.module.css'

interface DatabaseExplorerModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function DatabaseExplorerModal({ isOpen, onClose }: DatabaseExplorerModalProps) {
	type DbChoice = 'settings' | 'media'

	const settingsDb = useMemo(() => new PouchDB('karaoke-db'), [])
	const [mediaPath, setMediaPath] = useState<string>('')
	const [selectedDb, setSelectedDb] = useState<DbChoice>('settings')
	const [dbInfo, setDbInfo] = useState<any>(null)
	const [docRows, setDocRows] = useState<Array<{ id: string; rev?: string }>>([])
	const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
	const [expandedDoc, setExpandedDoc] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [loadingDoc, setLoadingDoc] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (isOpen) {
			initialize()
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		refresh()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, selectedDb])

	const initialize = async () => {
		try {
			setError(null)
			const doc: any = await settingsDb.get('settings').catch((e: any) => {
				if (e?.status === 404) return null
				throw e
			})
			const configured = (doc?.mediaPath || '').trim()
			setMediaPath(configured)

			const canUseMedia = !!configured && !!window.database
			setSelectedDb(canUseMedia ? 'media' : 'settings')
		} catch (err: any) {
			console.error('Failed to initialize database explorer:', err)
			setMediaPath('')
			setSelectedDb('settings')
		}
	}

	const ensureMediaDbReady = async (): Promise<void> => {
		const mp = (mediaPath || '').trim()
		if (!mp) {
			throw new Error('Media folder is not configured. Go to Tools → Settings first.')
		}
		if (!window.database) {
			throw new Error('Database API is not available.')
		}
		await window.database.configureMediaPath(mp)
	}

	const refresh = async () => {
		try {
			setLoading(true)
			setError(null)
			setExpandedDocId(null)
			setExpandedDoc(null)

			if (selectedDb === 'settings') {
				const info = await settingsDb.info()
				setDbInfo(info)
				const result = await settingsDb.allDocs({ include_docs: false })
				setDocRows(
					(result.rows || []).map((r: any) => ({
						id: r.id,
						rev: r?.value?.rev,
					}))
				)
				return
			}

			await ensureMediaDbReady()
			const info = await window.database.info()
			setDbInfo(info)
			const result = await window.database.allDocs({ include_docs: false })
			setDocRows(
				(result.rows || []).map((r: any) => ({
					id: r.id,
					rev: r?.value?.rev,
				}))
			)
		} catch (err: any) {
			console.error('Failed to load database info:', err)
			setDbInfo(null)
			setDocRows([])
			setError(err?.message || 'Failed to load database info')
		} finally {
			setLoading(false)
		}
	}

	const toggleDoc = async (docId: string) => {
		if (expandedDocId === docId) {
			setExpandedDocId(null)
			setExpandedDoc(null)
			return
		}

		try {
			setLoadingDoc(true)
			setError(null)
			let doc: any
			if (selectedDb === 'settings') {
				doc = await settingsDb.get(docId)
			} else {
				await ensureMediaDbReady()
				doc = await window.database.getDoc(docId)
				if (doc == null) {
					const e: any = new Error('not_found: missing')
					e.status = 404
					e.docId = docId
					throw e
				}
			}
			setExpandedDocId(docId)
			setExpandedDoc(doc)
		} catch (err: any) {
			console.error('Failed to load document:', err)
			setExpandedDocId(null)
			setExpandedDoc(null)
			setError(err?.message || 'Failed to load document')
		} finally {
			setLoadingDoc(false)
		}
	}

	const deleteDoc = async (docId: string, rev: string | undefined) => {
		try {
			if (!rev) {
				return
			}
			if (selectedDb === 'settings') {
				await settingsDb.remove(docId, rev)
			} else {
				await ensureMediaDbReady()
				await window.database.removeDoc(docId, rev)
			}
			await refresh()
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
							<div className={styles.dbSelectorRow}>
								<label className={styles.dbSelectorLabel}>
									Database
									<select
										className={styles.dbSelectorSelect}
										value={selectedDb}
										onChange={(e) => setSelectedDb(e.target.value as any)}
									>
										<option value="settings">Settings (AppData)</option>
										<option value="media" disabled={!mediaPath || !window.database}>
											{mediaPath ? 'Media (Configured folder)' : 'Media (Not configured)'}
										</option>
									</select>
								</label>

								<button className={modalStyles.primaryBtn} onClick={refresh}>
									<i className="fas fa-sync-alt"></i> Refresh
								</button>
							</div>

							{error && <p className={modalStyles.noData}>{error}</p>}

							{dbInfo && (
								<div className={modalStyles.infoSection}>
									<h3 className={modalStyles.sectionTitle}>Database Information</h3>
									<div className={styles.dbInfo}>
										<div className={styles.infoItem}>
											<strong>Name:</strong> {dbInfo.db_name || dbInfo.name}
										</div>
										<div className={styles.infoItem}>
											<strong>Documents:</strong> {dbInfo.doc_count}
										</div>
										<div className={styles.infoItem}>
											<strong>Update Seq:</strong> {dbInfo.update_seq}
										</div>
									</div>
								</div>
							)}

							<div>
								<div className={modalStyles.sectionHeader}>
									<h3 className={modalStyles.sectionTitle}>Documents ({docRows.length})</h3>
								</div>

								{docRows.length === 0 ? (
									<p className={modalStyles.noData}>No documents found.</p>
								) : (
									<div className={modalStyles.scrollableList}>
										{docRows.map((row, index) => {
											const isExpanded = expandedDocId === row.id
											return (
												<div key={row.id} className={modalStyles.listItem}>
												<div
													className={`${modalStyles.listItemHeader} ${styles.clickableHeader} ${
														isExpanded ? styles.selectedHeader : ''
													}`}
													onClick={() => toggleDoc(row.id)}
												>
													<strong className={modalStyles.listItemTitle}>
														Document {index + 1}: {row.id}
													</strong>
													<button
														className={modalStyles.dangerBtn}
														onClick={(e) => {
															e.stopPropagation()
															deleteDoc(row.id, row.rev)
														}}
														title="Delete document"
														disabled={!row.rev}
													>
														<i className="fas fa-trash"></i>
													</button>
												</div>

												{isExpanded && (
													<div className={modalStyles.listItemContent}>
														{loadingDoc ? (
															<p className={modalStyles.noData}>Loading document...</p>
														) : (
															<pre className={modalStyles.codeBlock}>{JSON.stringify(expandedDoc, null, 2)}</pre>
														)}
													</div>
												)}
											</div>
											)
										})}
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
