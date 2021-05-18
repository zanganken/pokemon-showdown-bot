const {console: {info}, toId} = require('./utils')
const {nick} = require('./conf')

const Room = require('./bo/Room')
const User = require('./bo/User')

const {say} = Parser

const Cmds = {
// Commandes de la plèbe (+ mps au bot pour les utilisateurs dont le rang n'est pas global)
	' ': {
		quit: 'leave',
		leave: (args, user, room) => {
			if(args.length === 0 && room instanceof Room && user.hasRank('@')) {
				Room.leaveRoom(room.id)
			} else if(room instanceof User) {
				let roomId = toId(args[0])
				
				if(Room.getRoom(roomId)?.getUser(user.id)?.hasRank('@')) {
					Room.leaveRoom(roomId)
					info(nick + " a quitté la room \"" + roomId + "\" sur demande de " + user.name)
				}
			}
		}
	},
// Commandes accessibles à partir de voice
	'+': {
		chintok: (args, user, room) => {
			say("Salut, je suis un bot développé en **Jaaj**vascript.", room)
		}
	},
// Commandes accessibles à partir de driver
	'%': {
		rooms: (args, user, room) => {
			console.log(Room.list)
		}
	},
// Commandes accessibles à partir de moderator
	'@': {
		quit: 'leave',
		leave: (args, user, room) => {
			// S'il s'agit d'un PM d'un global[@] ou +
			if(room instanceof User) {
				let roomId = toId(args[0])
				
				if(Room.getRoom(roomId)) {
					Room.leaveRoom(roomId)
					info(nick + " a quitté la room \"" + roomId + "\" sur demande de " + user.name)
				}
			}
		},
		
		s: 'say',
		say: (args, user, room) => {
			let roomId = toId(args.shift())
			let target = Room.getRoom(roomId)
			
			if(target) {
				let msg = args.join(' ')
				
				info(user.name + " [sur " + target.id +"]: " + msg)
				say(msg, target)
			} else {
				say("Je ne suis pas dans la room **\"" + roomId + "\"**.\nJ'accepte les **/invit nomDeLaRoom** des **global[%] ou +** ou des **personnes whitelistées**.", user)
			}
		},
	},
// Commandes accessibles à partir de room owner
	'#': {},
// Commandes accessibles à partir de admin
	'&': {},
// Commandes accessibles à partir de manitou suprème
	'~': {}
}

module.exports = Cmds
