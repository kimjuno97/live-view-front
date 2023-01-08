import { io } from 'socket.io-client';

export default class Socket {
	#socket = null;
	#streamInfo = null;
	#saveRoomName = null;
	#peerConnection = null;
	#onOffToggle = {
		video: true,
		audio: true,
	};

	constructor(url) {
		this.#socket = io(url, {
			withCredentials: true,
		});
	}

	/** socket 초기화 및 세팅 */
	init() {
		// 연결
		this.#socket.on('connect', () => {
			console.log('welcome socket connection');
		});
		// Peer A 방장
		this.#socket.on('welcome', async () => {
			const offer = await this.#peerConnection.createOffer();

			this.#peerConnection.setLocalDescription(offer);
			this.#socket.emit('offer', offer, this.#saveRoomName);
		});
		// Peer B 참여자
		this.#socket.on('offer', async offer => {
			this.#peerConnection.setRemoteDescription(offer);
			const answer = await this.#peerConnection.createAnswer();
			this.#peerConnection.setLocalDescription(answer);
			this.#socket.emit('answer', answer, this.#saveRoomName);
		});

		this.#socket.on('answer', answer => {
			this.#peerConnection.setRemoteDescription(answer);
		});

		this.#socket.on('ice', ice => {
			this.#peerConnection.addIceCandidate(ice);
		});
	}

	/** 객체 내부 전체 콘솔 함수 */
	echo() {
		console.log('========= echo ========');
		console.log('#streamInfo', this.#streamInfo);
		console.log('#peerConnection', this.#peerConnection);
		console.log('#saveRoomName', this.#saveRoomName);
		console.log('========= echo ========');
	}
	/** RoomeName값 저장 */
	savedRoomName(roomName) {
		this.#saveRoomName = roomName;
	}
	/** stream 정보 저장,처음 및 video, audio 제새팅시 사용 */
	async savedStreamInfo() {
		try {
			this.#streamInfo = await navigator.mediaDevices.getUserMedia(
				this.#onOffToggle
			);
		} catch (err) {
			console.error('socket.option saved#StreamInfo 과정 중 에러 : ', err);
		}
	}

	/**
	 * videoEl에 stream 객체 전달
	 * @param videoEl videoRef.current
	 */
	showVideo(videoEl) {
		videoEl.srcObject = this.#streamInfo;
	}
	/**
	 *  다른 참여자 추가하는 함수
	 * @param addPlayerFn handleAddStream
	 */
	settingPeerConnection(addPlayerFn) {
		this.#peerConnection = new RTCPeerConnection();

		// arrow fn을 사용한 this가 가르키는 객체 컨트롤
		this.#peerConnection.addEventListener('icecandidate', data =>
			this.iceEmit(data)
		);

		this.#peerConnection.addEventListener('addstream', data =>
			addPlayerFn(data)
		);
		this.#streamInfo
			.getTracks()
			.forEach(track => this.#peerConnection.addTrack(track, this.#streamInfo));
	}
	/** 'settingPeerConnection'에 종속 되어 있음 */
	iceEmit(data) {
		this.#socket.emit('ice', data.candidate, this.#saveRoomName);
	}
	/** join할 룸 요청하는 함수 */
	joinRoomEmit() {
		this.#socket.emit('join_room', this.#saveRoomName);
	}
	/** stream option 컨트롤 */
	onOffToggleHandler(target) {
		this.#onOffToggle[target] = !this.#onOffToggle[target];
		const getTargetTracks =
			target === 'video'
				? this.#streamInfo.getVideoTracks()
				: this.#streamInfo.getAudioTracks();

		getTargetTracks.forEach(track => (track.enabled = !track.enabled));
	}
	/** video, audio boolean 정보로 상태 text 전달 */
	namedAButton() {
		const cameraBtn = this.#onOffToggle.video ? 'camera off' : 'camera on';
		const speakerBtn = this.#onOffToggle.audio ? 'mute' : 'unmute';
		return { cameraBtn, speakerBtn };
	}

	sendChat(value) {
		this.#socket.emit('message', value, this.#saveRoomName);
	}
	returnChat(setState) {
		this.#socket.on('message', msg => {
			setState(msg);
		});
	}
}
