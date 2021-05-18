const WebSocketClient = require('websocket').client;

const {info, recv, error, ok} = require('./utils').console
const Connection = require('./utils').Connection
const {str: conStr} = Connection

// Déclaration des variables globales pour éviter les problèmes de dépendances circulaires
global.Parser = require('./parser')
global.Cmds = require('./cmds')

const connect = (retry) => {
	const ws = new WebSocketClient();
	
	ws.on('connect', con => {
		Connection.con = con
		ok("Connecté au serveur")
		
		// TODO: gérer les déconnexions
		
		con.on('message', res => {
			if(res.type === 'utf8') {
				let msg = res.utf8Data
				recv(msg)
				
				if(msg.charAt(0) === 'a') {
					// Envoi des données au parser pour le traitement
					Parser.data(msg)
				}
			}
		})
	})
	
	ws.connect(conStr)
	info("Connexion à " + conStr)
}

connect()
