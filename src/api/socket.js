import { io } from 'socket.io-client';

export default class Socket {
	socket = null;
	streamInfo = null;
	saveRoomName = null;
	peerConnection = null;

	constructor(url) {
		this.socket = io(url, {
			withCredentials: true,
		});
	}
	// socket 세팅
	init() {
		// 연결
		this.socket.on('connect', () => {
			console.log('welcome socket connection');
		});
		// Peer A 방장
		this.socket.on('welcome', async () => {
			const offer = await this.peerConnection.createOffer();
			this.peerConnection.setLocalDescription(offer);
			this.socket.emit('offer', offer, this.saveRoomName);
			console.log('Peer A가 방을 열었음');
		});
		// Peer B 참여자
		this.socket.on('offer', async offer => {
			this.peerConnection.setRemoteDescription(offer);
			const answer = await this.peerConnection.createAnswer();
			this.peerConnection.setLocalDescription(answer);
			this.socket.emit('answer', answer, this.saveRoomName);
			console.log('Peer B 가 Peer A방에 참여함');
		});

		this.socket.on('answer', answer => {
			console.log('answer data를 전달', answer);
			this.peerConnection.setRemoteDescription(answer);
		});

		this.socket.on('ice', ice => {
			console.log('ice를 깨자 ', ice);
			this.peerConnection.addIceCandidate(ice);
		});
	}
	// 테스트 용 나중에 지우기
	echo() {
		console.log('this는 어딜 가르키나', this);
		console.log('streamInfo', this.streamInfo);
		console.log('peerConnection', this.peerConnection);
		console.log('saveRoomName', this.saveRoomName);
	}

	savedRoomName(roomName) {
		this.saveRoomName = roomName;
	}

	async savedStreamInfo(mediaOtions) {
		try {
			this.streamInfo = await navigator.mediaDevices.getUserMedia(mediaOtions);
		} catch (err) {
			console.err('socket.op savedStreamInfo 과정 중 에러 : ', err);
		}
		return this.streamInfo;
	}

	settingPeerConnection(addPlayer) {
		this.peerConnection = new RTCPeerConnection();
		// arrow fn을 사용한 this가 가르키는 객체 컨트롤
		this.peerConnection.addEventListener('icecandidate', data =>
			this.iceEmit(data)
		);

		this.peerConnection.addEventListener('addstream', data => addPlayer(data));
		this.streamInfo
			.getTracks()
			.forEach(track => this.peerConnection.addTrack(track, this.streamInfo));
	}
	// settingPeerConnection에 종속 되어 있음
	iceEmit(data) {
		console.log('ice 전달을 하긴 함 > ::', data.candidate);
		this.socket.emit('ice', data.candidate, this.saveRoomName);
	}

	joinRoomEmit() {
		this.socket.emit('join_room', this.saveRoomName);
	}

	calling() {}
}
