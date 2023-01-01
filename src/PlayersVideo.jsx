import React, { useRef } from 'react';
import { useEffect } from 'react';

function PlayersVideo({ stream }) {
	const videoRef = useRef(null);

	useEffect(() => {
		videoRef.current.srcObject = stream;
	}, [stream]);
	return (
		<div>
			<video
				autoPlay
				playsInline
				ref={videoRef}
			/>
			<hr />
		</div>
	);
}

export default PlayersVideo;
