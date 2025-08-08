import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'
import './styles.css'

const db = new PouchDB('karaoke-db')

export default function App() {
    const [name, setName] = useState('...')
    const [input, setInput] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
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
        </div>
    )
}
