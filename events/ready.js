module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`[Init/Ready]: Logged in as ${client.user.tag}!`);

		// Dependencies
		const ranked = client.ranked
		const log = client.channels.cache.get(process.env.LOG_CHANNEL_ID)
		const savepoint_db = client.channels.cache.get(process.env.SAVEPOINT_DB_CHANNEL_ID)
		const games_db = client.channels.cache.get(process.env.GAMES_DB_CHANNEL_ID)	

		if (log == undefined || savepoint_db == undefined || games_db == undefined) {
			throw new Error("Unable to get log/savepoint/games channel access. Check server permissions.")
		}

		// Loading database
		console.log(`[Init/Ready]: Loading database...`)
		client.db = new Map()

		savepoint_db.messages.fetch({ limit: 100 }).then(save_logs => {
			// Load the (most recent) save point
			console.log(`[Init/Ready]: Received ${save_logs.size} save point logs.`);
			ranked.load_savepoint(client.db, save_logs)

			// Then, process games that occurred after the save point.
			games_db.messages.fetch({ limit: 100 }).then(game_results => {
				// Reverse the messages since discord sends messages in the "most recently sent" order, which is opposite of what we need.
				console.log(`[Init/Ready]: Received ${game_results.size} match results.`);
				const reversed_game_results = new Map(Array.from(game_results).reverse());

				reversed_game_results.forEach(game_result => ranked.process_match(client.db, game_result.content))

				// Log that we've loaded the database and are now ready!
				var log_message = `Ranked Bot v${ranked.VERSION} is now online!`
				console.log(`[Init/Ready]: Database has been loaded!`)
				console.log(client.db)
				console.log(`[Init/Ready]: ${log_message}`)
				log.send(log_message)
			})
		})
	}
};
