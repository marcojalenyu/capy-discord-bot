const { ApplicationCommandOptionType } = require('discord.js');
const List = require("../../models/List")

module.exports = {
    name: 'timezone',
    description: 'Change the timezone for the daily reminder.',
    options: [
        {
            name: 'timezone',
            description: 'UTC-# to be used for reminders (-12 to 14).',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],

    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            if (!list || interaction.guildId != list.guildId) {
                interaction.reply({
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                const timezone = interaction.options.getInteger('timezone');
                if (timezone < -12 || timezone > 14) {
                    interaction.reply({
                        content: "Please provide a valid timezone between -12 and 14.",
                        ephemeral: true
                    });
                    return;
                }
                list.timezone = timezone;
                // Update the remindTime to the new timezone
                let hours = new Date(list.remindTime).getUTCHours();
                hours -= timezone;
                if (hours < 0) {
                    hours += 24;
                }
                list.remindTime = new Date(list.remindTime).setUTCHours(hours);
                // Make sure the remindTime is in the future
                if (list.remindTime < new Date().getTime()) {
                    list.remindTime += 86400000;
                }
                await list.save();
                // format the reminder time to HH:MM AM/PM
                const formattedTime = new Date(list.remindTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                // Update the remindTime to the new timezone
                interaction.reply({
                    content: `Timezone changed to UTC ${timezone}. Daily reminder time: ${formattedTime}.`
                });
            }
        } catch (e) {
            interaction.reply({
                content: "An error occurred while changing the timezone.",
                ephemeral: true
            });
        }
    }
};