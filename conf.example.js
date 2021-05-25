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
	wl: new Map([['username', 'rank']]), // Remplacer rank par le rang d'accès que l'on veut attribuer à l'utilisateur
	
	// délais minimum entre les messages du bot
	MESSAGE_THROTTLE: 650,
	// délai de reconnexion en cas de déconnexion (en ms)
	RECONNECT_TIMEOUT: 30000,
	
	// PASTEBIN
	PASTEBIN_API_KEY: 'YourApiKey',
	PASTEBIN_USERAME: 'YourPastebinUsername',
	PASTEBIN_PASSWORD: 'YourPastebinPassword',
	
	// MONGODB
	MONGODB_URI: 'mongodb+srv://<YourMongodbUsername>:<YourMongodbPassword>@<YourMongodbDomain>/<YourMongodbDatabase>?retryWrites=true&w=majority',
	MONGODB_DATABASE: 'YourMongodbDatabase',
}

module.exports = Conf
