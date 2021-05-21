const WebSocketClient = require('websocket').client;

const {info, recv, error, ok} = require('./utils').console
const {RECONNECT_TIMEOUT, server} = require('./conf')

const Connection = require('./utils').Connection
const {str: conStr} = Connection

const Room = require('./bo/Room')

// Déclaration des variables globales pour éviter les problèmes de dépendances circulaires
global.Parser = require('./parser')
global.Cmds = require('./cmds')

const connect = () => {
	const ws = new WebSocketClient();
	
	ws.on('connectFailed', err => {
		error('Échec de la connexion au serveur ' + server + ': ' + err.stack)
		retry()
	})
	
	ws.on('connect', con => {
		Connection.con = con
		ok("Connecté au serveur")
		
		con.on('error', err => {
			error('Erreur de connexion: ' + err.stack)
		})
		
		con.on('close', (code, reason) => {
			error('Connexion fermée: ' + reason + ' (' + code + ')')
			
			// Remise à zéro de la liste des rooms
			Room.list.clear()
			
			retry()
		})
		
		con.on('message', res => {
			if(res.type === 'utf8') {
				let msg = res.utf8Data
				recv(msg)
				
				if(msg.charAt(0) === 'a') {
					// Envoi des données au Parser pour le traitement
					Parser.data(msg)
				}
			}
		})
	})
	
	// Fonction de reconnexion
	const retry = () => {
		info('Nouvelle tentative dans '+ ~~(RECONNECT_TIMEOUT/1000) + " secondes")

		setTimeout(() => {
			connect(true)
		}, RECONNECT_TIMEOUT)
	}
	
	ws.connect(conStr)
	info("Connexion à " + conStr)
}

connect()
