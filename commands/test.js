const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Test.'),
	async execute(interaction) {

		var user = interaction.user

		await interaction.reply(`Test: ${user.tag} ${user.username} user test`);
	},
};