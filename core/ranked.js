//// Public constants
exports.MINIMUM_TO_AUTOSAVE = 5         // Max retrievable messages = 100, so needs to be less than that.
exports.INITIAL_RATING = 1500
exports.VERSION = "0.2"

//// Private Constants
const RAW_DATA_CHAR_LIMIT = 1900        // The discord limit is at 2000, but just to be safe, let's do a bit lower. 
    // (Don't make it exactly 2000, because there's no actual limit check in the update_savepoint() code.
const MINIMUM_SAVEPOINT_WARNING = 90    // If the savepoints become too large, things will become annoying lol. 
    // Maybe create extra db channels, or reduce data stored, or clear out inactive accounts, etc...
const SAVE_HEADER = "Savepoint@Game#"
const SAVE_PARAMS_AMOUNT = 7


//// State 
exports.last_game_id = 0          //(Do these need to be exports??)
exports.last_savepoint_id = 0



//// Profiles
exports.create_new_profile = function(profiles, user)
{
    profiles.set(user, 
    {
        rating: exports.INITIAL_RATING,
        wins: 0,
        losses: 0,
        game_wins: 0,
        game_losses: 0,
        winstreak: 0,
    })
}

exports.load_profile = function (profiles, params) {

    console.log(params)
    profiles.set(params[0], 
    {
        rating: parseInt(params[1]),
        wins: parseInt(params[2]),
        losses: parseInt(params[3]),
        game_wins: parseInt(params[4]),
        game_losses: parseInt(params[5]),
        winstreak: parseInt(params[6]),
    })
}


//// Rating
exports.calculate_new_ratings = function(wor, lor, wsco, lsco) {
    // https://docs.google.com/spreadsheets/d/1JJ2SyukW0yTae6aPwT1j9TKVaftTTlHIr5I_0ZzN3ok/edit#gid=0
    wor = parseInt(wor)
    lor = parseInt(lor)

    var wres = 1 - (lsco/ (2 * wsco))                                           // Winner result
    var lres = (lsco / (2 * wsco)) - 1                                          // Loser reult
    var ptsr = wor / lor                                                        // Points/rating ratio
    var mchw = (wor + lor) * wsco * (1/3)                                       // Match worth
    var wers = wor / mchw                                                       // Winner expected result
    var lers = -lor / mchw                                                      // Loser expected result
    var wpch = Math.sqrt(mchw / (ptsr * 2 ** (wers - wres))) * (wres - lres)    // Winner point/rating change
    var lpch = -Math.sqrt(mchw / (ptsr * 2 ** (lers - lres))) * (wres - lres)   // Loser point rating change
    var wnew = parseFloat(wor + wpch).toFixed(2)
    var lnew = parseFloat(lor + lpch).toFixed(2)

    return [wnew, lnew, wpch, lpch]
}

exports.get_rank = function (rating) {
    var rank_names
        = ["Bronze", "Silver" , "Gold", "Diamond", "Platinum", "Masters", "Grandmasters"]
    var rank_thresholds
        = [-999999, 1400, 1600, 1800, 2000, 2200]
    rating = parseInt(rating)

    for (let i = 0; i < rank_thresholds.length; i++) {
        if (rating < rank_thresholds[i]) {
            return rank_names[i - 1]
        }
    }

    return rank_names[rank_names.length - 1]
}

exports.get_rounded_rating = function (rating) {
    return parseInt(rating)
}


//// Core ranked processing/saving/loading
exports.process_match = function (profiles, raw_results)
{
    // Parameters
    const params = raw_results.split(" ")
    const game_id = parseInt(params[0])
    const winner = params[1]
    const loser = params[2]
    const winner_score = parseInt(params[3])
    const loser_score = parseInt(params[4])

    // Do not process if it's been done (via savepoint) already
    if (game_id <= exports.last_game_id){
        return
    }

    // Handle if there are any players that aren't in the database
    if (!profiles.has(winner)) {
        exports.create_new_profile (profiles, winner)
    }

    if (!profiles.has(loser)) {
        exports.create_new_profile (profiles, loser)
    }

    // Get profiles & new ratings
    const winner_profile = profiles.get(winner)
    const loser_profile = profiles.get(loser)
    const new_ratings = exports.calculate_new_ratings(winner_profile.rating, loser_profile.rating, winner_score, loser_score)

    // Apply winner's changes
    winner_profile.rating = new_ratings[0]
    winner_profile.wins += 1
    winner_profile.game_wins += parseInt(winner_score)
    winner_profile.game_losses += parseInt(loser_score)
    winner_profile.winstreak += 1

    // Apply loser's changes
    loser_profile.rating = new_ratings[1]
    loser_profile.losses += 1
    loser_profile.game_wins += parseInt(loser_score)
    loser_profile.game_losses += parseInt(winner_score)
    loser_profile.winstreak = 0

    // Update last game ID
    exports.last_game_id = game_id
    
    console.log(`[Init/Ranked]: Game #${game_id} has been processed.`)

    return new_ratings
}

exports.update_savepoint = async function (profiles, game_id, savepoint_channel, log_channel) {
    //Send a savepoint header
    await savepoint_channel.send(`${SAVE_HEADER} ${game_id}`)

    //Create the raw data messages
    var raw_data = ""
    var message_count = 0
    for (let [user, profile] of profiles.entries()) {
        //console.log(user)
        //console.log(profile)

        // Collect profile data into one big long message
        var user_text = user.replace("@","") // Remove the ping

        raw_data += `${(user_text)} `
        for (var info in profile) {
            //console.log(profile[info]);
            raw_data += `${profile[info]} `
        }

        // If the message is too big, send it.
        if (raw_data.length >= RAW_DATA_CHAR_LIMIT) {
          await savepoint_channel.send(`${raw_data}`)
          raw_data = ""
          message_count += 1
        }
    }

    // Once finished scanning the profiles, send whatever's left
    if (raw_data.length > 0) {
        await savepoint_channel.send(`${raw_data}`)
        message_count += 1
    }

    // We're done. Log it and update the bot's internal savepoint id.
     exports.last_savepoint_id = game_id
    await log_channel.send(`Save Point updated to Game #${game_id}. Size: ${message_count} message(s).`)

    // If too many messages were sent, send a warning.
    if (message_count >= MINIMUM_SAVEPOINT_WARNING) {
        await log_channel.send(`WARNING: The last save point took ${message_count} messages. The limit is 100.`)
    }
}

exports.load_savepoint = function (profiles, logs) {
    //console.log(logs)

    // Find the latest save point.
    const iterator = logs.values();
    var save_index = 0
    var savepoint_id = 0
    for (; save_index < logs.size; save_index++) {
        const log = iterator.next().value;

        //console.log(log.content)
        const data = log.content.split(" ")
        if (data[0] == SAVE_HEADER)
        {
            savepoint_id = parseInt(data[1]) // Removes the "#" in front
            exports.last_savepoint_id = savepoint_id
            exports.last_game_id = savepoint_id
            break;
        }
    }

    // Use the logs to load profiles.
    var logs_array = Array.from(logs, ([name, value]) => ({ name, value }));
    var initial_index = save_index - 1; // Skips the "SAVE_HEADER" message
    var profile_params;
    var params = [];
    for (let i = initial_index; i >= 0; i--) {
        var log = logs_array[i].value.content
        var log_split = log.split(" ")

        params = params.concat(log_split)
        while (params.length >= SAVE_PARAMS_AMOUNT)
        {
            profile_params = params.splice(0, SAVE_PARAMS_AMOUNT)
            exports.load_profile(profiles, profile_params)
        }
    }

    if (savepoint_id != 0) 
    {
        console.log(`[Init/Ranked]: Loaded save point from Match #${exports.last_savepoint_id}!`)
    } 
    else {
        console.log(`[Init/Ranked]: No save point found.`)
    }
}
