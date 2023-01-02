import { useState, useEffect, useRef } from 'react';

import './main.css';

import Socket from './api/socket';

import PlayersVideo from './PlayersVideo';

/** socket initial */
const socket = new Socket(process.env.REACT_APP_WEBSOCKET_URL);
socket.init();

function App() {
	const videoRef = useRef(null);

	const formInputRef = useRef(null);

	// 다른 플레이어 비디오 정보
	const [players, setPlayers] = useState([]);

	const [showVideo, setShowVideo] = useState(false);

	// hook hanlder, class로 값을 컨트롤 해서 hook handler 필요
	// eslint-disable-next-line no-unused-vars
	const [_, setHook] = useState(true);

	/** player 추가 하는 함수 */
	const handleAddStream = data => {
		setPlayers(prev => [...prev, data.stream]);
	};

	const calling = async () => {
		await socket.savedStreamInfo();
		socket.settingPeerConnection(handleAddStream);
		socket.joinRoomEmit();
	};

	const videoConnectHandler = async e => {
		e.preventDefault();
		socket.savedRoomName(formInputRef.current.value);
		formInputRef.current.value = '';
		await calling();
		setShowVideo(prev => !prev);
	};

	useEffect(() => {
		if (showVideo) {
			// 마운트 된 후에 실행되야 함
			socket.showVideo(videoRef.current);
		} else {
			formInputRef.current.focus();
		}
	}, [showVideo]);

	const videoHandler = async target => {
		socket.onOffToggleHandler(target);
		await socket.savedStreamInfo();
		socket.showVideo(videoRef.current);
		setHook(prev => !prev);
	};

	const { speakerBtn, cameraBtn } = socket.namedAButton();

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
