const url = require('url')
const https = require('https')
//const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const PastebinAPI = require('pastebin-ts')

const {console: {ok, info, cmdr, error}, toId, Connection} = require('./utils')
const {serverId, nick, pwd, cmdChar, rankArray, MONGODB_URI, MONGODB_DATABASE, PASTEBIN_API_KEY, PASTEBIN_USERAME, PASTEBIN_PASSWORD} = require('./conf')
const {customCmds} = require('./data')

const pastebin = new PastebinAPI({
	'api_dev_key': PASTEBIN_API_KEY,
	'api_user_name': PASTEBIN_USERAME,
	'api_user_password': PASTEBIN_PASSWORD
})

const Parser = {
	actionUrl: url.parse(`https://play.pokemonshowdown.com/~~${serverId}/action.php`),
	
	data: function(msg) {
		if(msg.charAt(0) === 'a') {
			data = JSON.parse(msg.substr(1))
			
			if(Array.isArray(data)) {
				for(let d of data) {
					this.splitMsg(d)
				}
			} else {
				this.splitMsg(data)
			}
		}
	},
	
	splitMsg: function(msg) {
		if(msg) {
			let spl = msg.split('\n')
			let room = null
			
			if(spl.length > 1) {
				if(spl[0].charAt(0) === '>') {
					if(spl[1].substr(1, 10) !== 'tournament') {
						// Renvoit le nom de la room sans le '>' en réduisant le tableau
						let roomId = spl.shift().substr(1)
						room = Room.getRoom(roomId)
						
						if (spl[0].substr(1, 4) === 'init') {
							let users = spl[2].substr(7)
							room = Room.add(roomId)
							
							room.users = users
							
							ok(`Room ${room.id} rejointe`)
							
							// On stop le traitement
							return
						}
						
						if (spl[0].substr(1) === 'deinit') {
							Room.list.delete(room.id)
						}
					}
				}
				
				for(let msg of spl) {
					this.message(msg, room)
				}
			} else {
				this.message(msg)
			}
		}
	},
	
	message: function(msg, room = null) {
		let spl = msg.split('|')
		let userId;
		
		switch(spl[1]) {
			case 'challstr':
				let challengeId = spl[2]
				let challengeStr = spl[3]
				
				let reqOptions = {
					hostname: this.actionUrl.hostname,
					port: this.actionUrl.port,
					path: this.actionUrl.pathname,
					agent: false
				}
				
				let data
				
				if(pwd) {
					reqOptions.method = 'POST'
					data = `act=login&name=${nick}&pass=${pwd}&challengekeyid=${challengeId}&challenge=${challengeStr}`
					reqOptions.headers = {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': data.length
					}
				} else {
					reqOptions.method = 'GET'
					reqOptions.path += `?act=getassertion&userid=${toId(nick)}&challengekeyid=${challengeId}&challenge=${challengeStr}`
				}
				
				let req = https.request(reqOptions, function(res) {
					res.setEncoding('utf8')
					var data = ''
					
					res.on('data', function(chunk) {
						data += chunk
					})
					
					res.on('end', function() {
						if(data === ';') {
							error('failed to log in; nick is registered - invalid or no password given')
							process.exit(-1)
						}
						if(data.length < 50) {
							error(`failed to log in: ${data}`)
							process.exit(-1)
						}

						if(data.indexOf('heavy load') !== -1) {
							error('the login server is under heavy load; trying again in one minute')
							
							setTimeout(function() {
								this.message(msg)
							}.bind(this), 60 * 1000)
							
							return
						}

						if (data.substr(0, 16) === '<!DOCTYPE html>') {
							error('Connection error 522; trying agian in one minute')
							
							setTimeout(function() {
								this.message(msg)
							}.bind(this), 60 * 1000)
							
							return
						}

						try {
							data = JSON.parse(data.substr(1))
							if (data.actionsuccess) {
								data = data.assertion
							} else {
								error(`could not log in; action was not successful: ${JSON.stringify(data)}`)
								process.exit(-1)
							}
						} catch (e) {}
						
						Connection.send(`|/trn ${nick},154,${data}`)
					}.bind(this))
				}.bind(this))
				
				req.on('error', function(err) {
					error(`login error: ${err.stack}`)
				})
				
				if(data) req.write(data)
				req.end()
				
				break;
			case 'updateuser':
				if(spl[2].substr(1) === nick) {
					if (spl[3] !== '1') {
						error('failed to log in, still guest')
						process.exit(-1)
					}
					
					Connection.send('|/avatar 154');
					ok(`Connecté en tant que ${spl[2].substr(1)}`)

					// On rejoint les rooms du fichier conf.js
					Room.joinAll();
				}
				
				break;
			case 'c':
				userId = toId(spl[2])
				
				if(room && room.users.has(userId) && userId != toId(nick)) {
					spl = spl.slice(3).join('|')
					this.chatMessage(spl, room.users.get(userId), room)
				}
				
				break;
			case 'c:':
				userId = toId(spl[3])
				
				if(room && room.users.has(userId) && userId != toId(nick)) {
					spl = spl.slice(4).join('|')
					this.chatMessage(spl, room.users.get(userId), room)
				}
				
				break;
			case 'pm':
				let user = new User(spl[2])
				
				if(user.id !== toId(nick)) {
					spl = spl.slice(4).join('|')
					
					if (spl.startsWith('/invite ') && user.hasRank('%') && !(toId(spl.substr(8)) === 'lobby' && Config.serverid === 'showdown')) {
						Connection.send(`|/join ${spl.substr(8)}`)
						info(`${nick} a rejoint la room "${spl.substr(8)}" sur demande de ${user.name}`)
					} else {
						this.chatMessage(spl, user, user)
					}
				}
				
				break;
			// Un joueur change de nom
			case 'N':
				room.onRename(spl[2], spl[3])
				
				break;
			case 'J': case 'j':
				room.addUser(spl[2])
				
				break;
			case 'l': case 'L':
				room.delUser(toId(spl[2]))
				
				break;
		}
	},
	
	chatMessage: function(msg, user, room) {
		// Si le message commence par le caractère de commande
		if(msg.startsWith(cmdChar)) {
			// Suppression des éventuels espaces en trop
			msg = msg.replace(/[ ]{2,}/gi, ' ')
			let spl = msg.trim().split(' ')
			
			// On isole le potentiel nom de commande
			let cmdName = spl.shift().substr(cmdChar.length)
			
			// On va boucler la liste des ranks en prenant le rank de l'utilisateur comme référence
			for(let i = rankArray.indexOf(user.rank); i >= 0; i--) {
				let cmdsOfRank = Cmds[rankArray[i]]
				let customCmdsOfRank = customCmds[rankArray[i]]
				
				while(Object.keys(cmdsOfRank).indexOf(cmdName) > -1) {
					if(typeof cmdsOfRank[cmdName] === 'string') {
						cmdName = cmdsOfRank[cmdName]
					} else if(typeof cmdsOfRank[cmdName] === 'function') {
						cmdsOfRank[cmdName](spl, user, room)
						cmdr(`Commande "${cmdName}" par ${user.name} [sur ${room.id}]: ${spl}`)
						
						return true
					} else {
						break
					}
				}
			
				if(customCmdsOfRank?.has(cmdName)) {
					this.say(customCmdsOfRank.get(cmdName).txt, room)
				}
			}
		}
	},
	
	say: function(msg, target) {
		let targetId = target.id
		spl = msg.split("\n")
		
		for(let msg of spl) {
			if(Room.getRoom(targetId)) {
				Connection.send(`${targetId !== 'lobby' ? targetId : ''}|${msg}`)
			} else {
				Connection.send(`|/pm ${targetId}, ${msg}`)
			}
		}
	},
	
	initCustomCmds: async function() {
		info("Initialisation des customCmds")
		
		let client = new MongoClient(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		
		try {
			await client.connect()
			
			let cursor = client.db(MONGODB_DATABASE).collection('customCmds').find()
			
			await cursor.forEach(doc => {
				for(let cmdName in doc.cmds) {
					customCmds[doc.rank]?.set(cmdName, doc.cmds[cmdName])
				}
			})
			
			ok("customCmds initialisées")
			
			await cursor.close()
		} catch(e) {
			error(e)
		} finally {
			await client.close()
		}
	},
	
	updateCustomCmds: async function(rank) {
		let client = new MongoClient(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		
		let result
		
		try {
			await client.connect()
			let customCmdsCollection = client.db(MONGODB_DATABASE).collection('customCmds')
			
			let filter = {
				rank: rank
			}
			let updateCmds = {
				$set: {
					cmds: {}
				}
			}
			let options = {
				upsert: true
			}
			
			customCmds[rank].forEach((value, key) => {
				updateCmds["$set"].cmds[key] = value
			})
			
			result = await customCmdsCollection.updateOne(filter, updateCmds, options)
		} catch(e) {
			error(e)
		} finally {
			client.close()
		}
		
		return result?.modifiedCount
	},
	
	upToPastebin: function(title, text, room) {
		//fs.writeFileSync("./pastebin.txt", text)
		
		pastebin.createPaste({
			title: title,
			text: text,
			format: null,
			privacy: 1,
			expiration: '10M'
		}).then(data => {
			this.say(data, room)
		}).catch(err => {
			this.say(`Une erreur est survenue, impossible de récupérer la liste des commandes.`, room)
			// Something went wrong
			error(err)
		})
	},
}

module.exports = Parser