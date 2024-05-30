const List = require("../../models/List")

/**
 * @file register.js
 * Possible Formats: /register
 */
module.exports = {
    name: 'register',
    description: 'Create a list and send daily reminders in this channel.',
    
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
                // If interaction is in a guild, create a list with the guildId
                // Else create a list with the userId
                const newList = new List();
                if (interaction.guildId) {
                    newList.guildId = interaction.guildId;
                    newList.channelId = interaction.channelId;
                } else {
                    newList.userId = interaction.user.id;
                }
                await newList.save();
                interaction.reply({ content: "List registered. Daily reminder time: 9:00 AM." });
            }
        } catch (e) {
            interaction.reply({ 
                content: "There was an error registering the list.",
                ephemeral: true
            });
        }
        
    }
}