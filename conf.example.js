const Conf = {
	server: 'sim.psim.us',
	port: 8000,
	serverId: 'showdown',
	
	nick: 'YourBotNick',
	pwd: 'YourBotPassword',
	
	rooms: [],
	privateRooms: [],
	
	cmdChar: '.', // caractère de commande (exemple: .infos)
	
	rankArray: [' ','+','%','@','#','&','~'],
	
	dbLvl: 3, // niveau de débuggage
	wl: new Map(),
	
	// délais minimum entre les messages du bot
	MESSAGE_THROTTLE: 650,
	// délai de reconnexion en cas de déconnexion
	RECONNECT_TIMEOUT: 30000
}

module.exports = Conf
