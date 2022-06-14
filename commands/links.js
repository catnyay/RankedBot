const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('links')
		.setDescription('Get all of the relevant FFC links!'),
	async execute(interaction) {

		var user = interaction.user

		await interaction.reply(`Visit our page!\n Page (to be updated soon :eyes:): https://RankBot.thekee2004.repl.co\nUptime: https://stats.uptimerobot.com/JXQ2AsBVL1`);
	},
};