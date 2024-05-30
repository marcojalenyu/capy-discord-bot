const { ApplicationCommandOptionType } = require("discord.js");
const List = require("../../models/List")
const Reminder = require("../../models/Reminder");

module.exports = {
    name: 'delete',
    description: 'Delete a reminder from the list.',
    options: [
        {
            name: 'category',
            description: 'The category of the reminder.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'name',
            description: 'The name of the reminder.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
    ],

    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // If the list does not exist, reply with an error message and return
            if (!list || interaction.guildId != list.guildId) {
                interaction.reply({ 
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                // Get the category and name of the reminder
                const category = interaction.options.getString('category');
                const name = interaction.options.getString('name');

                // Find the reminder in the database
                const reminder = await Reminder.findOne({ listId: list._id, category: category, name: name });

                // If the reminder does not exist, reply with an error message and return
                if (!reminder) {
                    interaction.reply({ content: "The reminder does not exist." });
                    return;
                }

                // Delete the reminder from the database
                await reminder.deleteOne();
                list.reminders.pull(reminder._id);
                await list.save();

                interaction.reply({ content: "Reminder deleted." });
            }
        } catch (e) {
            console.log(e);
            interaction.reply({ 
                content: "There was an error deleting the reminder.",
                ephemeral: true
            });
        }
    }
}