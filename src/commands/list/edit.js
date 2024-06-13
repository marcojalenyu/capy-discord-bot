const { ApplicationCommandOptionType } = require('discord.js');
const List = require('../../models/List');
const Reminder = require('../../models/Reminder');

module.exports = {
    name: 'edit',
    description: 'Edit a reminder in the list.',
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
        {
            name: 'attribute',
            description: 'The attribute to edit.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: 'Category',
                    value: 'category',
                },
                {
                    name: 'Name',
                    value: 'name'
                },
                {
                    name: 'Description',
                    value: 'description'
                },
                {
                    name: 'Deadline',
                    value: 'deadline'
                },
                {
                    name: 'Time',
                    value: 'time'
                },
                {
                    name: 'Type',
                    value: 'type'
                }
            ]
        },
        {
            name: 'value',
            description: 'The new value of the attribute.',
            type: ApplicationCommandOptionType.String,
            required: true
        }
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
                // Get the category, name, attribute, and value of the reminder
                const category = interaction.options.getString('category');
                const name = interaction.options.getString('name');
                const attribute = interaction.options.getString('attribute');
                const value = interaction.options.getString('value');

                // Find the reminder in the database
                const reminder = await Reminder.findOne({ listId: list._id, category: category, name: name });

                // If the reminder does not exist, reply with an error message and return
                if (!reminder) {
                    interaction.reply({ content: "The reminder does not exist." });
                    return;
                }

                // Edit the attribute of the reminder
                switch (attribute) {
                    case 'category':
                        reminder.category = value;
                        break;
                    case 'name':
                        reminder.name = value;
                        break;
                    case 'description':
                        reminder.description = value;
                        break;
                    case 'deadline':
                        // Split the deadline into month, day, and year
                        let [month, day, year] = value.split('/');
                        // Check if the deadline is in the correct format
                        if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || (year && (isNaN(year) || year.length != 4))){
                            interaction.reply({
                                content: "Please provide a valid deadline in the format MM/DD or MM/DD/YYYY.",
                                ephemeral: true
                            });
                            return;
                        }
                        // If no year is provided, set the year to the current year (if the deadline has not passed)
                        if (!year) {
                            if (new Date().getMonth() + 1 > month || (new Date().getMonth() + 1 == month && new Date().getDate() > day)) {
                                year = new Date().getFullYear() + 1;
                            } else {
                                year = new Date().getFullYear();
                            }
                        }
                        // Set the deadline of the reminder
                        reminder.deadline = new Date(Date.UTC(year, month - 1, day));
                        // Set to 23:59:59
                        const timezone = list.timezone;
                        let finalHour = 23 - timezone;
                        if (finalHour > 23) finalHour -= 24;
                        reminder.deadline.setUTCHours(finalHour);
                        reminder.deadline.setUTCMinutes(59);
                        reminder.deadline.setUTCSeconds(59);
                        break;
                    case 'time':
                        // Check if time is in the correct format
                        if (!value.match(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i)) {
                            interaction.reply({
                                content: "Please provide a valid time in the format HH:MM AM/PM.",
                                ephemeral: true
                            });
                            return;
                        }
                        // Convert the time to 24-hour format
                        let [hours, minutes] = value.split(':');
                        hours = parseInt(hours);
                        minutes = parseInt(minutes.slice(0, 2));
                        if (value.includes('PM') && hours < 12) hours += 12;
                        if (value.includes('AM') && hours == 12) hours = 0;
                        // If hour is negative, add 24 to get the correct hour; if hour is greater than 23, subtract 24
                        hours -= list.timezone;
                        if (hours < 0) hours += 24;
                        reminder.deadline.setUTCHours(hours);
                        reminder.deadline.setUTCMinutes(minutes);
                        reminder.deadline.setUTCSeconds(59);
                        reminder.markModified('deadline');
                        break;
                    case 'type':
                        reminder.type = value;
                        break;
                    default:
                        interaction.reply({ content: "Invalid attribute." });
                        return;
                }

                // Save the reminder in the database
                await reminder.save();
                
                interaction.reply({ content: `Reminder "${category} - ${name}" edited.` });
            }
        } catch (e) {
            console.log(e);
            interaction.reply({ 
                content: "There was an error editing the reminder.",
                ephemeral: true
            });
        }
    }
}