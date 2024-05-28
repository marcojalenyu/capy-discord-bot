/**
 * This function retrieves the application commands for a bot.
 * @param {*} client 
 * @param {*} guildId: can be null 
 * @returns 
 */
module.exports = async (client, guildId = null) => {
    let applicationCommands;

    if (guildId) {
        const guild = await client.guilds.fetch(guildId);
        applicationCommands = guild.commands;
    } else {
        applicationCommands = await client.application.commands;
    }

    await applicationCommands.fetch();
    return applicationCommands;
}