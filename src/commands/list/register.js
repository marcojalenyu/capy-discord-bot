const { ApplicationCommandOptionType } = require("discord.js");
const List = require("../../models/List")

/**
 * @file register.js
 * Possible Formats: /register
 */
module.exports = {
    name: 'register',
    description: 'Create a list and send daily reminders in this channel.',
    options: [
        {
            name: 'timezone',
            description: 'UTC-# to be used for reminders (-12 to 14).',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],
    
    callback: async ( client, interaction) => {
        try {
            // Check if the user already has a list registed in the database
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // If they do, reply with an error message and return
            // If they don't, create a new list in the database
            if (list && interaction.guildId == list.guildId) {
                interaction.reply({ 
                    content: "You already have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                // Check if the timezone is valid
                const timezone = interaction.options.getInteger('timezone');
                if (timezone < -12 || timezone > 14) {
                    interaction.reply({
                        content: "Please provide a valid timezone between -12 and 14.",
                        ephemeral: true
                    });
                    return;
                }
                // If interaction is in a guild, create a list with the guildId
                // Else create a list with the userId
                const newList = new List();
                if (interaction.guildId) {
                    newList.guildId = interaction.guildId;
                    newList.channelId = interaction.channelId;
                } else {
                    newList.userId = interaction.user.id;
                }
                newList.timezone = timezone;
                // Add by 1 day to prevent immediate reminder
                newList.remindTime = new Date().setUTCHours(0, 0, 0, 0) + 86400000 + ((9 - timezone) * 3600000);
                await newList.save();
                // format the reminder time to HH:MM AM/PM
                const formattedTime = new Date(newList.remindTime - timezone * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                interaction.reply({ content: `List registered at UTC ${timezone}. Daily reminder time: ${formattedTime}.` });
            }
        } catch (e) {
            interaction.reply({ 
                content: "There was an error registering the list.",
                ephemeral: true
            });
        }
        
    }
}