const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('report')
		.setDescription('Report a completed match.')
        .addUserOption(option =>
            option.setName('winner') // If you get "Invalid string format" it's because names must be lower-case -_-;;
                .setDescription('The winner of the match.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('loser')
                .setDescription('The loser of the match.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winner_score') // If you get "invalid regex form thingy", it's cause you can't have spaces -_-*
                .setDescription('The number of games the winner won.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('loser_score')
                .setDescription('The number of games the loser won.')
                .setRequired(true)),
	async execute(interaction) {
        // Dependencies
        const ranked = client.ranked
        const profiles = client.db
        const games_channel = client.channels.cache.get(process.env.GAMES_DB_CHANNEL_ID)
        const log_channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID)

        // Parameters
        const winner = interaction.options.getUser('winner')
        const loser = interaction.options.getUser('loser')
        const w_score = interaction.options.getInteger('winner_score')
        const l_score = interaction.options.getInteger('loser_score')

        // Check for input errors
        const error_result = `(You reported \"${winner.tag} defeated ${loser.tag} ${w_score}-${l_score}\")`
        if (check_for_input_errors(error_result))
            return
        
        // Report is valid; process and log it.
        const game_id = parseInt(ranked.last_game_id) + 1
        const savepoint_id = parseInt(ranked.last_savepoint_id)

        // Responses
        const winner_username = winner.tag
        const loser_username = loser.tag
        const log_message = `Match #${game_id} - ${winner_username} has defeated ${loser_username} ${w_score}-${l_score}.`
            + `\n\t(Reported by ${interaction.user.tag})`
        const raw_results = `${game_id} ${winner_username} ${loser_username} ${w_score} ${l_score}`

        // Process new ratings
        var winner_profile = profiles.get(winner_username)
        var loser_profile = profiles.get(loser_username)
	//	const rank = ranked.get_rank(profile.rating)
        var winner_old_rating = ranked.INITIAL_RATING;
        var loser_old_rating = ranked.INITIAL_RATING;  
        
        if (winner_profile != undefined) {
            winner_old_rating = parseInt(winner_profile.rating);
        }
        if (loser_profile != undefined) {
            loser_old_rating = parseInt(loser_profile.rating);
        }
      
        var rating_results = ranked.process_match(profiles, raw_results)
        var winner_rating = parseInt(rating_results[0])
        var loser_rating = parseInt(rating_results[1])
        var winner_rating_change = parseInt(rating_results[2])
        var loser_rating_change = parseInt(rating_results[3])

        // If match count exceeds save point by a certain amount, update savepoint.
        if (game_id - savepoint_id > ranked.MINIMUM_TO_AUTOSAVE)
        {
            const savepoint_channel = client.channels.cache.get(process.env.SAVEPOINT_DB_CHANNEL_ID)
            ranked.update_savepoint(profiles, game_id, savepoint_channel, log_channel)
        }

        // Responses
        const report_response = `${log_message}`
            + `\n\n\t${winner_username} (+${winner_rating_change}), ${winner_old_rating} -> ${winner_rating}`
            + `\n\t${loser_username} (${loser_rating_change}), ${loser_old_rating} -> ${loser_rating}`
            + `\n\n(If you made a mistake, delete the corresponding log in the ${games_channel} channel)`

        // Finally, send responses
        await games_channel.send(raw_results);
        await log_channel.send(log_message);
		await interaction.reply(report_response);
	},
};

function check_for_input_errors(error_message) {
    if (winner == loser) {
        await interaction.reply(`Invalid report - the winner and loser cannot be the same. ${semi_raw_results}`);
        return
    } else if (l_score > w_score) {
        await interaction.reply(`Invalid report - the loser can't have won more games than the winner. ${semi_raw_results}`);
        return
    } else if (l_score == w_score) {
        await interaction.reply(`Invalid report - one player must have a higher game count than the other. ${semi_raw_results}`);
        return
    } else if (l_score < 0 || w_score < 0){
        await interaction.reply(`Invalid report - you can't have a negative game count. ${semi_raw_results}`);
        return
    }
}