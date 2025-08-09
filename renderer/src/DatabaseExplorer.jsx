import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

export default function DatabaseExplorer() {
    const [dbInfo, setDbInfo] = useState(null)
    const [allDocs, setAllDocs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const info = await db.info()
            setDbInfo(info)

            const result = await db.allDocs({ include_docs: true })
            setAllDocs(result.rows)

            console.log('Database adapter:', db.adapter)
            console.log('Database name:', db.name)
            console.log('Current location:', window.location.href)
        } catch (err) {
            console.error('Failed to load database info:', err)
        } finally {
            setLoading(false)
        }
    }

    const deleteDoc = async (docId) => {
        try {
            const doc = await db.get(docId)
            await db.remove(doc)
            loadData() // Refresh
        } catch (err) {
            console.error('Failed to delete document:', err)
        }
    }

    if (loading) {
        return (
            <div className="container">
                <div className="card">
                    <p>Loading database information...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <div className="card">
                <h1 style={{ marginTop: 0 }}>Database Explorer</h1>

                {dbInfo && (
                    <div style={{ marginBottom: 16 }}>
                        <h3>Database Information</h3>
                        <p className="hint">
                            <strong>Name:</strong> {dbInfo.db_name}<br />
                            <strong>Documents:</strong> {dbInfo.doc_count}<br />
                            <strong>Size:</strong> {Math.round(dbInfo.data_size / 1024)}KB<br />
                            <strong>Adapter:</strong> {db.adapter}<br />
                            <strong>Location:</strong> {window.location.href}
                        </p>
                    </div>
                )}

                <div style={{ marginBottom: 16 }}>
                    <h3>All Documents ({allDocs.length})</h3>
                    <button onClick={loadData} style={{ marginBottom: 12 }}>
                        Refresh
                    </button>
                </div>

                {allDocs.length === 0 ? (
                    <p className="hint">No documents found.</p>
                ) : (
                    <div>
                        {allDocs.map((row, index) => (
                            <div key={row.id} style={{
                                background: '#1a1f2e',
                                border: '1px solid #2a2f3a',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong>Document {index + 1}: {row.id}</strong>
                                    <button
                                        onClick={() => deleteDoc(row.id)}
                                        style={{
                                            background: '#dc3545',
                                            fontSize: '0.8em',
                                            padding: '4px 8px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                                <pre style={{
                                    background: '#0a0d12',
                                    padding: 8,
                                    borderRadius: 4,
                                    fontSize: '0.8em',
                                    overflow: 'auto',
                                    margin: 0
                                }}>
                                    {JSON.stringify(row.doc, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
