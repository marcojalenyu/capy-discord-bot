const List = require("../../models/List")

/**
 * @file register.js
 * Possible Formats: /register
 */
module.exports = {
    name: 'register',
    description: 'Register/create a list (only 1/server allowed).',
    
    callback: async ( client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // Check if the user already has a list registed in the database
            // If they do, reply with an error message and return
            // If they don't, create a new list in the database
            if (list) {
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
                } else {
                    newList.userId = interaction.user.id;
                }
                await newList.save();
                interaction.reply({ content: "List registered." });
            }
        } catch (e) {
            console.log("There was an error registering the list.");
        }
        
    }
}