const { ApplicationCommandOptionType } = require("discord.js");
const List = require("../../models/List")

module.exports = {
    name: 'daily',
    description: 'Change the daily reminder time.',
    options: [
        {
            name: 'time',
            description: 'The new daily reminder time (HH:MM).',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            if (!list) {
                interaction.reply({
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                const time = interaction.options.getString('time');
                
                // Check if the time is in the correct format
                const [hours, minutes] = time.split(':').map(Number);
                if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                    interaction.reply({
                        content: "Please provide a valid time in the format HH:MM.",
                        ephemeral: true
                    });
                    return;
                } else {
                    list.remindTime = time;
                    await list.save();
                    interaction.reply({
                        content: `Daily reminder time set to ${time}.`
                    });
                }                
            }
        } catch (e) {
            interaction.reply({
                content: "There was an error setting the daily reminder time.",
                ephemeral: true
            });
        }
    }
}