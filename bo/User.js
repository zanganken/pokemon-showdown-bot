const {toId} = require('../utils')
const {wl, rankArray} = require('../conf')

class User {
	#id
	#name
	#rank
	
	constructor(name) {
		this.name = name
	}
	
	get id() {
		return this.#id
	}
	
	get name() {
		return this.#name
	}
	
	get rank() {
		return wl.has(this.id) ? wl.get(this.id) : this.#rank
	}
	
	set name(name) {
		this.#id = toId(name)
		this.#name = name.substr(1)
		this.#rank = name.charAt(0)
	}
	
	hasRank(rank) {
		let rankIndex = rankArray.indexOf(rank)
		let userEffectiveRank = wl.has(this.id) ? rankArray.indexOf(wl.get(this.id)) : rankArray.indexOf(this.rank)
		
		if(userEffectiveRank >= rankIndex) return true
		
		return false
	}
}

module.exports = User
