const io = require('socket.io-client');

// const { store, dispatch } = useContext(LessonContext)

let openSocketClients = [];

class Socket {
	constructor(url, authorization, resolve) {
		this.url = url;
		this.socket = io(url);
		this.id = openSocketClients.length;
		openSocketClients.push({ socket: this.socket, url });

		this.isConnected = false;
		this.resolve = resolve;

		this.socket.on('connect', () => {
			this.authorization(authorization);
			this.isConnected = this.socket.connected;
			this.resolve();
		});

		this.socket.on('reconnect', () => {
			this.authorization(authorization);
			this.isConnected = this.socket.connected;
		});

		this.socket.on('disconnect', () => {
			openSocketClients = openSocketClients.splice(this.id, 1);
			this.isConnected = this.socket.connected;
		});

		this.socket.on('error', (error) => {
			console.error(error);
			/* dispatch({
				type: 'ERROR',
				payload: 'Die Verbindung zum Server konnte nicht aufrecht erhalten werden'
			}) */
		});

		this.getOpenSockets = () => openSocketClients;
	}


	async authorization(token) {
		try {
			await this.emit('authorization', {
				token,
			});
		} catch (err) {
			console.error(err);
			/* dispatch({
				type: 'ERROR',
				payload: 'Die Authentifizierung ist fehlgeschlagen. Bitte melde dich an'
			}) */
		}
	}

	on(...params) {
		this.socket.on(...params);
		return this;
	}

	emit(...params) {
		return new Promise((resolve, reject) => {
			this.socket.emit(...params, (error, message) => {
				if (error) return reject(error);
				return resolve(message);
			});
		});
	}

	async joinChannel(courseId, lessonId, params) {
		await this.emit(
			'get',
			`course/${courseId}/lessons`,
			lessonId,
			params,
		);
	}

	close() {
		this.socket.close();
	}
}
module.exports = (url, jwt, resolve) => new Socket(url, jwt, resolve);
