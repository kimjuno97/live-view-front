import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './main.css';
import PlayersVideo from './PlayersVideo';

const socket = io('ws://10.58.52.111:3001', {
	withCredentials: true,
	// extraHeaders: {
	// 	'my-custom-header': 'abcd',
	// },
});
socket.on('connect', () => {
	console.log('socket 연결');
});

let saveRoomName = null;
let peerConnection = null;

// peer A 브라우저가 실행
socket.on('welcome', async () => {
	const offer = await peerConnection.createOffer();
	// console.log('sent the offer');
	peerConnection.setLocalDescription(offer);
	socket.emit('offer', offer, saveRoomName);
});

// peer B 브라우저가 실행
socket.on('offer', async offer => {
	// console.log('recieved the offer');
	peerConnection.setRemoteDescription(offer);
	const answer = await peerConnection.createAnswer();
	peerConnection.setLocalDescription(answer);
	socket.emit('answer', answer, saveRoomName);
	// console.log('sent the answer');
});

socket.on('answer', answer => {
	// console.log('recieve the answer');
	peerConnection.setRemoteDescription(answer);
});

socket.on('ice', ice => {
	peerConnection.addIceCandidate(ice);
	// console.log('received candidate');
});

function App() {
	const videoRef = useRef(null);
	const streamRef = useRef(null);
	const formInputRef = useRef(null);

	// 다른 플레이어 비디오 정보
	const [players, setPlayers] = useState([]);

	const [showVideo, setShowVideo] = useState(false);

	// 카메라 바꾸는 기능
	// const [options, setOptions] = useState([{ device: 2, label: '2222' }]);

	const [onOffToggles, setOnOffToggles] = useState({
		camera: true,
		speaker: true,
	});

	const videoConnectHandler = e => {
		e.preventDefault();
		saveRoomName = formInputRef.current.value;
		formInputRef.current.value = '';
		setShowVideo(prev => !prev);
	};

	useEffect(() => {
		const handleIce = data => {
			socket.emit('ice', data.candidate, saveRoomName);
			// console.log('sent candidate');
		};

		const handleAddStream = data => {
			console.log('doed');
			console.log('Peer stream', data.stream);
			// console.log('my stream', streamRef.current);

			setPlayers(prev => [...prev, data.stream]);
		};

		/** 커넥션 연결하는 코드 */
		const makeConnection = () => {
			peerConnection = new RTCPeerConnection();
			peerConnection.addEventListener('icecandidate', handleIce);
			peerConnection.addEventListener('addstream', handleAddStream);
			streamRef.current
				.getTracks()
				.forEach(track => peerConnection.addTrack(track, streamRef.current));
		};

		const { camera, speaker } = onOffToggles;
		/** init call  */
		const playVideo = async () => {
			try {
				streamRef.current = await navigator.mediaDevices.getUserMedia({
					video: camera,
					audio: speaker,
				});
				videoRef.current.srcObject = streamRef.current;
				console.log('strema', streamRef);
			} catch (err) {
				console.error('error', err);
			}
		};
		if (showVideo) {
			const calling = async () => {
				await playVideo();
				makeConnection();
				socket.emit('join_room', saveRoomName);
			};
			calling();
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

	console.log('players', players);
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
					<button onClick={() => videoHandler('camera')}>{cameraBtn}</button>
					<button onClick={() => videoHandler('speaker')}>{speakerBtn}</button>
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
