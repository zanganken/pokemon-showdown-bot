const colors = require('colors')
const {differenceInMilliseconds} = require('date-fns')

const {dbLvl, server, port, MESSAGE_THROTTLE} = require('./conf')

var Utils = {
	console: {
		// messages reçus
		recv: text => {
			if (dbLvl === 0) console.log('recv'.grey + '  ' + text)
		},
		// commandes reçues
		cmdr: text => {
			if (dbLvl === 1) console.log('cmdr'.grey + '  ' + text)
		},
		// data envoyées
		dsend: text => {
			if (dbLvl <= 1) console.log('send'.grey + '  ' + text)
		},
		debug: text => {
			if(dbLvl <= 2) console.log('debug'.blue + ' ' + text)
		},
		info: text => {
			if(dbLvl <= 3) console.log('info'.cyan + '  ' + text)
		},
		ok: text => {
			if (dbLvl <= 4) console.log('ok'.green + '    ' + text)
		},
		error: text => {
			console.log('error'.red + ' ' + text)
		}
	},
	
	Connection: {
		con: null,
		queue: [],
		queueTimeout: new Date(),
		send: function(data) {
			if(data) {
				this.queue.push(data)
				let self = this
				
				// Délai entre les messages
				setTimeout(() => {
					let data = self.queue.shift()
					
					if(self.con && self.con.connected) {
						if (!Array.isArray(data)) data = [data.toString()]
						
						data = JSON.stringify(data)
						
						Utils.console.dsend(data)
						self.con.send(data)
					}
					
					self.queueTimeout = new Date()
				}, this.queue.length * MESSAGE_THROTTLE - differenceInMilliseconds(new Date(), this.queueTimeout))
			}
		},
		// chaine de connexion générée aléatoirement
		get str() {
			let chars = 'abcdefghijklmnopqrstuvwxyz0123456789_'
			let str = ''
			
			for(let i = 0, l = chars.length; i < 8; i++) {
				str += chars.charAt(~~(Math.random() * l))
			}
			
			return 'ws://' + server + ':' + port + '/showdown/' + ~~(Math.random() * 1000) + '/' + str + '/websocket'
		}
	},
	
	toId: text => {
		return text?.toLowerCase().replace(/[^a-z0-9]/g, '')
	},
}

module.exports = Utils
