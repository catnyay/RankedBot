module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);

        client = interaction.client

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            //await
            command.execute(interaction);
        } catch (error) {
            console.error(error);
            //removed await on above and this one..
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
	},
};