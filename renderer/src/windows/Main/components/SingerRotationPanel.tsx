export default function SingerRotationPanel() {
	return (
		<>
			<div className="singer-header">
				<span>#</span>
				<span>Singer Rotation</span>
				<span></span>
				<span></span>
			</div>
			<div className="singer-list">
				<div className="singer-item current-singer">
					<span className="singer-avatar">1</span>
					<span className="singer-name">John Smith</span>
					<span></span>
					<span className="show-on-hover">⋯</span>
				</div>
				<div className="singer-item">
					<span className="singer-avatar">2</span>
					<span className="singer-name">Alice Brown</span>
					<span></span>
					<span className="show-on-hover">⋯</span>
				</div>
				<div className="singer-item">
					<span className="singer-avatar">3</span>
					<span className="singer-name">Mike Johnson</span>
					<span></span>
					<span className="show-on-hover">⋯</span>
				</div>
				<div className="singer-item">
					<span className="singer-avatar">4</span>
					<span className="singer-name">Sarah Davis</span>
					<span></span>
					<span className="show-on-hover">⋯</span>
				</div>
			</div>
		</>
	)
}
