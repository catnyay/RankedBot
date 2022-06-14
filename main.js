// Note:
// This script loads the RankedBot and all its dependencies.
//	*Make sure that "deploy-commands.js" has been run at least once before running this.
// After logging into Discord, it finishes loading the Ranked database at "events/ready.js".

// Check the version of node
console.log('Node.js', process.version)

// Dependencies
require('dotenv').config();
const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const keep_alive = require('./keepalive.js')

// Setup client 
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Update commands
const setup = require('./deploy-commands.js')

// Load commands
console.log('[Init/Main]: Loading command files.')
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

// Load events
console.log('[Init/Main]: Loading event files.')
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Load ranked
console.log('[Init/Main]: Loading core files.')
client.ranked = require(`./core/ranked.js`)

// Finally, login
keep_alive()
console.log('[Init/Main]: Logging in...')
client.login(process.env.DISCORD_TOKEN);