import React, { useEffect, useState, useRef } from 'react'
import PouchDB from 'pouchdb-browser'
import DatabaseExplorer from './DatabaseExplorer.jsx'
import Settings from './Settings.jsx'
import MediaBrowser from './MediaBrowser.jsx'
import VideoPlayer from './VideoPlayer.jsx'
import VideoPlayerWindow from './VideoPlayerWindow.jsx'
import './styles.css'

const db = new PouchDB('karaoke-db')

export default function App() {
	// Check which view to show based on URL params
	const urlParams = new URLSearchParams(window.location.search)
	const view = urlParams.get('view')

	if (view === 'dbexplorer') {
		return <DatabaseExplorer />
	}

	if (view === 'settings') {
		return <Settings />
	}

	if (view === 'mediabrowser') {
		return <MediaBrowser />
	}

	if (view === 'videoplayer') {
		return <VideoPlayerWindow />
	}

	const [name, setName] = useState('...')
	const [input, setInput] = useState('')
	const [saving, setSaving] = useState(false)
	const [mediaPath, setMediaPath] = useState('')
	const [currentVideo, setCurrentVideo] = useState('')
	const videoPlayerRef = useRef(null)

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
					try {
						await db.put(doc)
					} catch { }
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

			// Load media path from settings
			try {
				const settingsDoc = await db.get('settings')
				if (!cancelled && settingsDoc.mediaPath) {
					setMediaPath(settingsDoc.mediaPath)
				}
			} catch (err) {
				// Settings don't exist yet, that's fine
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [])

	// Listen for video play commands from media browser
	useEffect(() => {
		if (window.videoPlayer) {
			const handlePlayVideo = (event, videoPath) => {
				console.log('Received play video command:', videoPath)
				setCurrentVideo(videoPath)
			}

			window.videoPlayer.onPlayVideo(handlePlayVideo)

			return () => {
				window.videoPlayer.removePlayVideoListener(handlePlayVideo)
			}
		}
	}, [])

	// Listen for video state requests from video player window
	useEffect(() => {
		if (!window.videoState) {
			return;
		}

		const handleGetVideoState = () => {
			// Get current video state from the VideoPlayer component
			let videoState = {
				currentVideo: currentVideo,
				currentTime: 0,
				isPlaying: false,
				volume: 1,
			}

			// Get detailed state from VideoPlayer ref if available
			if (videoPlayerRef.current && videoPlayerRef.current.getVideoState) {
				const detailedState = videoPlayerRef.current.getVideoState()
				videoState = { ...videoState, ...detailedState }
			}

			console.log('Sending video state:', videoState)
			window.videoState.sendVideoState(videoState)
		}

		window.videoState.onGetVideoState(handleGetVideoState)

		return () => {
			window.videoState.removeGetVideoStateListener(handleGetVideoState)
		}

	}, [currentVideo])

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
					<input
						value={input}
						onChange={e => setInput(e.target.value)}
						placeholder="Your name"
					/>
					<button onClick={save} disabled={saving}>
						{saving ? 'Saving…' : 'Save'}
					</button>
				</div>

				{/* Display current media path if set */}
				{mediaPath && (
					<div
						style={{
							marginTop: 16,
							padding: 12,
							background: '#1a1f2e',
							border: '1px solid #2a2f3a',
							borderRadius: 6,
						}}
					>
						<p className="hint" style={{ margin: '0 0 4px 0', fontSize: '0.85em' }}>
							<strong>Media Files Location:</strong>
						</p>
						<code style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>
							{mediaPath}
						</code>
					</div>
				)}

				<p className="hint" style={{ marginTop: 16, fontSize: '0.9em' }}>
					💡 Use <strong>File → Database Explorer</strong> to explore the database
					<br />
					⚙️ Use <strong>File → Settings</strong> to configure media files location
					<br />
					🎬 Use <strong>File → Media Browser</strong> to search and browse video files
				</p>
			</div>

			{/* Video Player */}
			<div className="card" style={{ marginTop: 16 }}>
				<h2 style={{ margin: '0 0 16px 0', fontSize: '1.2em' }}>Video Player</h2>
				<VideoPlayer
					videoRef={videoPlayerRef}
					currentVideo={currentVideo}
					onVideoEnd={() => setCurrentVideo('')}
				/>
			</div>
		</div>
	)
}
