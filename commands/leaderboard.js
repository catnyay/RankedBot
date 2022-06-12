const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Display the leaderboard.')
		.addIntegerOption(option =>
            option.setName('start_rank')
                .setDescription('The rank to start displaying at.')
                .setRequired(false)),
	async execute(interaction) {
		// Dependencies
        const profiles = client.db
        const log_channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID)

		// Parameters
		var user = interaction.user
		var starting_rank = interaction.options.getInteger('start_rank')

		// Constants
		const NUMBER_OF_PROFILES_TO_SHOW = 8

		// Validating input (if starting rank is too low)
		if (starting_rank <= 0) {
			starting_rank = 0
		} else {
			starting_rank -= 1
		}


		// Sort the profiles by rating
		var sorted_profile_array = [...profiles]
		sorted_profile_array.sort(([k1,v1], [k2,v2]) => 
			v2.rating - v1.rating
		)

		// Validating input (if starting rank is too high)
		var ending_rank = starting_rank + NUMBER_OF_PROFILES_TO_SHOW
		if (sorted_profile_array.length <= ending_rank) {
			ending_rank = sorted_profile_array.length - 1
		}

		if (starting_rank >= sorted_profile_array.length - 1) {
			starting_rank = sorted_profile_array.length - NUMBER_OF_PROFILES_TO_SHOW
			if (starting_rank < 0) {
				starting_rank = 0
			}
		}

		// Creating leaderboard
		const leaderboardEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Leaderboard')

		// Adding player info
		for (let current_rank = starting_rank; current_rank < ending_rank; current_rank++) {
			var profile = sorted_profile_array[current_rank]

			console.log(profile[0], profile[1].rating)
			if (starting_rank == current_rank) {
				leaderboardEmbed.addFields(
					{ name: 'Rank', value: `#${String(current_rank + 1)}.`, inline: true },
					{ name: 'Name', value: String(profile[0]), inline: true },
					{ name: 'Rating', value: String(profile[1].rating), inline: true }
				)
			} else {
				leaderboardEmbed.addFields(
					{ name: '\u200B', value: `#${String(current_rank + 1)}.`, inline: true },
					{ name: '\u200B', value: String(profile[0]), inline: true },
					{ name: '\u200B', value: String(profile[1].rating), inline: true }	
				)
			}	
		}

		
		// Final footer info & sending
		leaderboardEmbed.addFields(
			{ name: '\u200B', value: `Showing ${starting_rank + 1} - ${ending_rank} of ${sorted_profile_array.length}.`, inline: false })
		leaderboardEmbed.setTimestamp();

		await interaction.reply({ embeds: [leaderboardEmbed] });
	},
};