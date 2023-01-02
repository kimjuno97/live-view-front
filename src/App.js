import { useState, useEffect, useRef } from 'react';

import './main.css';

import Socket from './api/socket';

import PlayersVideo from './PlayersVideo';
// socket 세팅
const socket = new Socket(process.env.REACT_APP_WEBSOCKET_URL);
socket.init();

function App() {
	const videoRef = useRef(null);

	const formInputRef = useRef(null);

	// 다른 플레이어 비디오 정보
	const [players, setPlayers] = useState([]);

	const [showVideo, setShowVideo] = useState(false);

	const [onOffToggles, setOnOffToggles] = useState({
		video: true,
		audio: true,
	});

	const videoConnectHandler = e => {
		e.preventDefault();
		socket.savedRoomName(formInputRef.current.value);
		formInputRef.current.value = '';
		setShowVideo(prev => !prev);
	};

	// player 추가 하는 함수
	const handleAddStream = data => {
		setPlayers(prev => [...prev, data.stream]);
	};
	console.log('plater', players);
	useEffect(() => {
		// 끌어 올리자 useEffect에서 실행되면 안됨
		if (showVideo) {
			const calling = async () => {
				videoRef.current.srcObject = await socket.savedStreamInfo(onOffToggles);
				socket.settingPeerConnection(handleAddStream);
				socket.joinRoomEmit();
			};
			calling();
			socket.echo();
		} else {
			// input창 foucs
			formInputRef.current.focus();
		}
	}, [onOffToggles, showVideo]);

	const videoHandler = target => {
		setOnOffToggles(prev => ({ ...prev, [target]: !prev[target] }));
	};

	const cameraBtn = onOffToggles.camera ? 'camera off' : 'camera on';
	const speakerBtn = onOffToggles.speaker ? 'mute' : 'unmute';

	return (
		<>
			<div className='App'>hello world</div>
			<hr />
			{!showVideo && (
				<form onSubmit={videoConnectHandler}>
					<input
						ref={formInputRef}
						type='text'
					/>
					<button type='submit'>Enter room</button>
				</form>
			)}
			<hr />
			{showVideo && (
				<div>
					<video
						autoPlay
						playsInline
						ref={videoRef}
					/>
					<br />
					<button onClick={() => videoHandler('video')}>{cameraBtn}</button>
					<button onClick={() => videoHandler('audio')}>{speakerBtn}</button>
				</div>
			)}
			<br />
			{players[0] &&
				players.map((stream, idx) => {
					return (
						<PlayersVideo
							key={idx}
							stream={stream}
						/>
					);
				})}
		</>
	);
}

export default App;
