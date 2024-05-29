const List = require("../../models/List")
const Reminder = require("../../models/Reminder");

module.exports = {
    name: 'clear',
    description: 'Clear all reminders from the list.',
    
    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // If the list does not exist, reply with an error message and return
            if (!list) {
                interaction.reply({ 
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                // Delete all reminders from the database
                await Reminder.deleteMany({ listId: list._id });
                list.reminders = [];
                await list.save();
                
                interaction.reply({ content: "Reminders cleared." });
            }
        } catch (e) {
            console.log(e);
            interaction.reply({ content: "There was an error clearing the reminders." });
        }
    }
};