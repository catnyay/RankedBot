const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Display the leaderboard.'),
	async execute(interaction) {
		// Dependencies
        const profiles = client.db
        const log_channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID)

		var user = interaction.user

		var sorted_profile_array = [...profiles]
		sorted_profile_array.sort(([k1,v1], [k2,v2]) => 
			v2.rating - v1.rating
		)

		// inside a command, event listener, etc.
		const exampleEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Leaderboard')
			// .setThumbnail('https://i.imgur.com/AfFp7pu.png')
			
		// Add player info
		var current_rank = 0
		var starting_rank = current_rank
		
		for (let current_rank = starting_rank; current_rank < starting_rank + 8; current_rank++) {
			if (sorted_profile_array.length < current_rank) {
				break
			}
			var profile = sorted_profile_array[current_rank]

			console.log(profile[0], profile[1].rating)
			if (starting_rank == current_rank) {
				exampleEmbed.addFields(
					{ name: 'Rank', value: `#${String(current_rank + 1)}.`, inline: true },
					{ name: 'Name', value: String(profile[0]), inline: true },
					{ name: 'Rating', value: String(profile[1].rating), inline: true }
				)
			} else {
				exampleEmbed.addFields(
					{ name: '\u200B', value: `#${String(current_rank + 1)}.`, inline: true },
					{ name: '\u200B', value: String(profile[0]), inline: true },
					{ name: '\u200B', value: String(profile[1].rating), inline: true }	
				)
			}	
		}

		exampleEmbed.setTimestamp();

		await interaction.reply({ embeds: [exampleEmbed] });
	},
};