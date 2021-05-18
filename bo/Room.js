const User = require('./User')
const {rooms, privateRooms} = require('../conf')
const {Connection, toId} = require('../utils')

class Room {
// -----------------------
// STATIC VARS AND METHODS
// -----------------------
	static #rooms = new Map()
	
// -------
// GETTERS
// -------
	static get list() {
		return this.#rooms
	}

	static getRoom(id) {
		return this.#rooms.get(id)
	}
// -------
// METHODS
// -------
	static add(id, isPrivate = false) {
		this.#rooms.set(id, new Room(id, isPrivate))
		
		return this.getRoom(id)
	}
	
	static join(room, isPrivate = false) {
		let roomId = toId(room)
		
		this.add(roomId, isPrivate)
		Connection.send('|/join ' + room)
	}
	
	static joinAll() {
		for(let room of rooms) {
			Room.join(room)
		}
		
		for(let room of privateRooms) {
			Room.join(room, true)
		}
	}
	
	static leaveRoom(roomId) {
		if(this.#rooms.has(roomId)) {
			Connection.send('|/leave ' + roomId)
			this.#rooms.delete(roomId)
		}
	}
// -------------------------
// INSTANCE VARS AND METHODS
// -------------------------
	#id
	#isPrivate
	#users
	
	constructor(id, isPrivate = false) {
		this.#id = id
		this.#isPrivate = isPrivate
		this.#users = new Map()
	}
	
	get id() {
		return this.#id
	}
	
	get users() {
		return this.#users
	}
	
	set users(users) {
		if(users !== '0') {
			users = users.split(',');
			
			for (let i = 1; i < users.length; i++) {
				this.addUser(users[i])
			}
		}
	}
	
	getUser(userId) {
		return this.#users.get(userId)
	}
	
	addUser(username) {
		let user = new User(username)
		
		this.#users.set(user.id, user)
	}
	
	delUser(userId) {
		if(this.#users.has(userId)) {
			this.#users.delete(userId)
		}
	}
	
	onRename(newName, oldName) {
		this.delUser(oldName)
		this.addUser(newName)
	}
}

module.exports = Room
