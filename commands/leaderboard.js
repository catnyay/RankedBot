const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Display the leaderboard.'),
	async execute(interaction) {

		var user = interaction.user

		await interaction.reply(`Test: ${user.tag} ${user.username} user test`);
	},
};