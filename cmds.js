const {console: {info, debug}, toId} = require('./utils')
const {nick, rankArray} = require('./conf')
const {customCmds} = require('./data')

const {say} = Parser

const Cmds = {
// Commandes de la plèbe (+ mps au bot pour les utilisateurs dont le rang n'est pas global)
	' ': {
		quit: 'leave',
		leave: (args, user, room) => {
			if(room instanceof User && args[0]) {
				let target = Room.getRoom(toId(args[0]))
				
				if(user.hasRankInRoom('@', target)) {
					Cmds['@'].leave(args, user, room)
				}
			}
		},
		
		say: (args, user, room) => {
			if(room instanceof User && args[0]) {
				let target = Room.getRoom(toId(args[0]))
				
				if(user.hasRankInRoom('%', target)) {
					args[0] = target.id
					
					Cmds['@'].say(args, user, room)
				}
			}
		},
	},
// Commandes accessibles à partir de voice
	'+': {
		chintok: (args, user, room) => {
			say(`Salut, je suis un bot développé en **Jaaj**vascript. Mon code est visible sur https://github.com/zanganken/pokemon-showdown-bot.`, room)
		},
		
		comlist: (args, user, room) => {
			let text = ``
			
			for(let rank in customCmds) {
				customCmds[rank].forEach((cmd, cmdName) => {
					text += `[${rank}]${cmdName} (par ${cmd.author || 'inconnu'}): ${cmd.txt}\n`
				})
			}
			
			Parser.upToPastebin("Liste des commandes", text, room)
		},
	},
// Commandes accessibles à partir de driver
	'%': {},
// Commandes accessibles à partir de moderator
	'@': {
		quit: 'leave',
		leave: (args, user, room) => {
			let roomId = args[0] ? toId(args[0]) : room.id
			
			if(Room.leaveRoom(roomId)) {
				info(`${nick} a quitté la room "${roomId}" sur demande de ${user.name}`)
			}
		},
		
		s: 'say',
		say: (args, user, room) => {
			let roomId = toId(args.shift())
			let target = Room.getRoom(roomId)
			
			if(target) {
				let msg = args.join(' ')
				
				if(msg) {
					info(`${user.name} [sur ${target.id}]: ${msg}`)
					say(msg, target)
				} else {
					say(`Il faut spécifier le message à afficher par le bot (**.say room message**)`, user)
				}
			} else if(!roomId) {
				say(`Il faut spécifier la room, puis le message à afficher par le bot (**.say room message**)`, user)
			} else {
				say(`Je ne suis pas dans la room **"${roomId}"**.\nJ'accepte les **/invite nomDeLaRoom** des **global[%] ou +** ou des **personnes whitelistées**.`, user)
			}
		},
		
		// Fonctions relatives à data.customCmds
		add: async (args, user, room) => {
			if(!user.hasSuperRank('@')) return
			
			let rank = '+'
			
			if(rankArray.indexOf(args[0].charAt(0)) > -1) {
				rank = args[0].charAt(0)
				args[0] = args[0].substr(1)
			}
			
			let cmdName = args.shift()
			let txt = args.join(' ')
			let author = user.name
			
			customCmds[rank].set(cmdName, {
				txt: txt,
				author: author,
				date: new Date()
			})
			
			if(await Parser.updateCustomCmds(rank) > 0) {
				say(`Commande [${rank}]${cmdName} ajoutée.`, room)
			} else {
				customCmds[rank].delete(cmdName)
				
				say(`Échec de l'ajout de la commande [${rank}]${cmdName}.`, room)
			}
		},
		del: 'delete',
		delete: async (args, user, room) => {
			if(!user.hasSuperRank('@')) return
			
			let rank = '+'
			
			if(rankArray.indexOf(args[0].charAt(0)) > -1) {
				rank = args[0].charAt(0)
				args[0] = args[0].substr(1)
			}
			
			let cmdName = args.shift()
			
			if(user.hasRank(rank) && customCmds[rank]?.has(cmdName)) {
				let cmdCopy = customCmds[rank].get(cmdName)
				
				customCmds[rank].delete(cmdName)
				
				if(await Parser.updateCustomCmds(rank) > 0) {
					say(`Commande [${rank}]${cmdName} supprimée.`, room)
				} else {
					customCmds[rank].set(cmdName, cmdCopy)
					
					say(`Échec de la suppression de la commande [${rank}]${cmdName}.`, room)
				}
			}
		}
	},
// Commandes accessibles à partir de room owner
	'#': {},
// Commandes accessibles à partir de admin
	'&': {},
// Commandes accessibles à partir de manitou suprème
	'~': {}
}

module.exports = Cmds
