import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'
import './styles.css'

const db = new PouchDB('karaoke-db')

export default function App() {
    const [name, setName] = useState('...')
    const [input, setInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [dbInfo, setDbInfo] = useState(null)
    const [allDocs, setAllDocs] = useState([])

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                // Get database info
                const info = await db.info()
                setDbInfo(info)

                // Log database adapter and location info
                console.log('Database adapter:', db.adapter)
                console.log('Database name:', db.name)
                console.log('Current location:', window.location.href)
                console.log('User agent:', navigator.userAgent)

                // Get all documents
                const result = await db.allDocs({ include_docs: true })
                setAllDocs(result.rows)

                const doc = await db.get('user')
                if (!cancelled) {
                    const n = doc.name || 'World'
                    setName(n)
                    setInput(n)
                }
            } catch (err) {
                if (err && err.status === 404) {
                    const doc = { _id: 'user', name: 'World' }
                    try { await db.put(doc) } catch { }
                    if (!cancelled) {
                        setName('World')
                        setInput('World')
                        // Refresh all docs after creating the initial doc
                        const result = await db.allDocs({ include_docs: true })
                        setAllDocs(result.rows)
                    }
                } else {
                    console.error('Failed to load name', err)
                    if (!cancelled) {
                        setName('World')
                        setInput('World')
                    }
                }
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    const save = async () => {
        setSaving(true)
        try {
            let doc
            try {
                doc = await db.get('user')
            } catch (e) {
                if (e.status === 404) {
                    doc = { _id: 'user' }
                } else {
                    throw e
                }
            }
            doc.name = input.trim() || 'World'
            await db.put(doc)
            setName(doc.name)

            // Refresh all docs after save
            const result = await db.allDocs({ include_docs: true })
            setAllDocs(result.rows)
        } catch (e) {
            console.error('Save failed', e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="container">
            <div className="card">
                <h1 style={{ marginTop: 0 }}>Hello, {name}</h1>
                <p className="hint">Data source: PouchDB (local)</p>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your name" />
                    <button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                </div>
            </div>

            {/* Database Explorer */}
            <div className="card" style={{ marginTop: 16 }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '1.2em' }}>Database Explorer</h2>

                {dbInfo && (
                    <div style={{ marginBottom: 16 }}>
                        <p className="hint" style={{ margin: '0 0 8px 0' }}>
                            Database: {dbInfo.db_name} | Docs: {dbInfo.doc_count} | Size: {Math.round(dbInfo.data_size / 1024)}KB
                        </p>
                    </div>
                )}

                <details>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>All Documents ({allDocs.length})</summary>
                    <pre style={{
                        background: '#0a0d12',
                        padding: 12,
                        borderRadius: 6,
                        fontSize: '0.85em',
                        overflow: 'auto',
                        maxHeight: 300
                    }}>
                        {JSON.stringify(allDocs.map(row => row.doc), null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    )
}
