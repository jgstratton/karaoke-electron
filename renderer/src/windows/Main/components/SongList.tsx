export default function SongList() {
	return (
		<>
			<div className="queue-header">
				<span>#</span>
				<span>Singer</span>
				<span>Song</span>
				<span>Title</span>
				<span>Status</span>
				<span></span>
			</div>
			<div className="queue-list">
				<div className="queue-item current-song">
					<span className="queue-position">1</span>
					<span className="queue-singer">John Smith</span>
					<span></span>
					<span className="song-title">Sweet Caroline</span>
					<span className="song-status">Now Playing</span>
					<span className="show-on-hover">⋯</span>
				</div>
				<div className="queue-item">
					<span className="queue-position">2</span>
					<span className="queue-singer">Alice Brown</span>
					<span></span>
					<span className="song-title">Don't Stop Believin'</span>
					<span className="song-status">Queued</span>
					<span className="show-on-hover">⋯</span>
				</div>
				<div className="queue-item">
					<span className="queue-position">3</span>
					<span className="queue-singer">Mike Johnson</span>
					<span></span>
					<span className="song-title">Bohemian Rhapsody</span>
					<span className="song-status">Queued</span>
					<span className="show-on-hover">⋯</span>
				</div>
				<div className="queue-item">
					<span className="queue-position">4</span>
					<span className="queue-singer">Sarah Davis</span>
					<span></span>
					<span className="song-title">I Want It That Way</span>
					<span className="song-status">Queued</span>
					<span className="show-on-hover">⋯</span>
				</div>
			</div>
		</>
	)
}
