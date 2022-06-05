const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Display a player\'s profile.')
		.addUserOption(option =>
            option.setName('player') 
                .setDescription('The player whose profile you want to display. Omitting this will display your profile.')
                .setRequired(false)),
	async execute(interaction) {

		const db = interaction.client.db
        var player = interaction.options.getUser('player')
		var player_text = ""

		if (!player) {
			player_text = interaction.user.username
			player = interaction.user.tag
		} else {
			player_text = player.username
			player = player.tag

		}
		
		if (!db.has(player)){
			await interaction.reply(`${player_text} has not played any ranked matches!`);
			return
		}

		const profile = db.get(player)
		const ranked = interaction.client.ranked
		const rank = ranked.get_rank(profile.rating)
		const rounded_rating = ranked.get_rounded_rating(profile.rating)
		var message = `${player_text}'s profile `
			+ `\n\tRating: ${rounded_rating} \t(${rank})`
			+ `\n\tMatch W/L: ${profile.wins}/${profile.losses}`

		var winstreak = parseInt(profile.winstreak)
		if (winstreak >= 3) {
			message += `\t(${winstreak} game winstreak!)`
		}

		message	+=`\n\tGames W/L: ${profile.game_wins}/${profile.game_losses}`

		await interaction.reply(message);
	},
};