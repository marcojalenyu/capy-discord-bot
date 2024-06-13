const { ApplicationCommandOptionType } = require("discord.js");
const List = require("../../models/List")

module.exports = {
    name: 'daily',
    description: 'Change the daily reminder time.',
    options: [
        {
            name: 'time',
            description: 'Follow HH:MM AM/PM format.',
            type: ApplicationCommandOptionType.String,
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
                // Get the time from the interaction
                const time = interaction.options.getString('time');
                
                // Check if time is in the correct format (if provided)
                if (time && !time.match(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i)) {
                    interaction.reply({
                        content: "Please provide a valid time in the format HH:MM AM/PM.",
                        ephemeral: true
                    });
                    return;
                }

                // Convert HH:MM AM/PM to 24-hour format
                const timezone = list.timezone;
                let [hours, minutes] = time.split(':');
                hours = parseInt(hours);
                minutes = parseInt(minutes.slice(0, 2));
                if (time.includes('PM') && hours < 12) hours += 12;
                if (time.includes('AM') && hours == 12) hours = 0;
                
                // If hour is negative, add 24 to get the correct hour; if hour is greater than 23, subtract 24
                hours -= timezone;
                if (hours < 0) {
                    hours += 24;
                }
                // Set the remindTime to the new time
                list.remindTime = new Date().setUTCHours(hours, minutes, 0, 0) + 86400000;
                await list.save();
                interaction.reply({
                    content: `Daily reminder time set to ${time}.`
                });
                            
            }
        } catch (e) {
            interaction.reply({
                content: "There was an error setting the daily reminder time.",
                ephemeral: true
            });
        }
    }
}