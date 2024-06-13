const { ApplicationCommandOptionType } = require("discord.js");
const List = require("../../models/List");
const Reminder = require("../../models/Reminder");

module.exports = {
    name: 'add',
    description: 'Add a reminder to the list.',
    options: [
        {
            name: 'category',
            description: 'English, Math, Cooking, etc.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'name',
            description: 'Quiz 1, Help Mom, etc.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'deadline',
            description: 'Follow MM/DD or MM/DD/YYYY format.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'time',
            description: 'Follow HH:MM AM/PM format.',
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: 'description',
            description: 'The description of the reminder.',
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: 'type',
            description: 'The type of reminder.',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: 'Task',
                    value: 'task'
                },
                {
                    name: 'Event',
                    value: 'event'
                }
            ]
        }
    ],

    callback: async (client, interaction) => {
        try {   
            // Find the list associated with the guildId or userId
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // If the list does not exist, reply with an error message and return
            if (!list || interaction.guildId != list.guildId) {
                interaction.reply({ 
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                // Get the reminder details from the interaction
                const category = interaction.options.getString('category');
                const name = interaction.options.getString('name');
                const deadline = interaction.options.getString('deadline');
                const time = interaction.options.getString('time');
                const description = interaction.options.getString('description');
                const type = interaction.options.getString('type');

                // Prevent reminders with the same name and category
                const existingReminder = await Reminder.findOne({ listId: list._id, category: category, name: name });
                if (existingReminder) {
                    interaction.reply({
                        content: "A reminder with the same name and category already exists.",
                        ephemeral: true
                    });
                    return;
                }

                // Split the deadline into month, day, and year
                let [month, day, year] = deadline.split('/');
                // Check if the deadline is in the correct format
                if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || (year && (isNaN(year) || year.length != 4))){
                    interaction.reply({
                        content: "Please provide a valid deadline in the format MM/DD or MM/DD/YYYY.",
                        ephemeral: true
                    });
                    return;
                }
                // Check if time is in the correct format (if provided)
                if (time && !time.match(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i)) {
                    interaction.reply({
                        content: "Please provide a valid time in the format HH:MM AM/PM.",
                        ephemeral: true
                    });
                    return;
                }

                // If no year is provided, set the year to the current year (if the deadline has not passed yet)
                if (!year) {
                    if (new Date().getMonth() + 1 > month || (new Date().getMonth() + 1 == month && new Date().getDate() > day)) {
                        year = new Date().getFullYear() + 1;
                    } else {
                        year = new Date().getFullYear();
                    }
                }
                
                // Create a new reminder
                const newReminder = new Reminder({
                    listId: list._id,
                    category: category,
                    name: name,
                    deadline: new Date(Date.UTC(year, month - 1, day)),
                    description: description || '',
                    type: type || 'task'
                });

                // If the reminder has a time, set the time
                const timezone = list.timezone;
                if (time) {
                    // Convert HH:MM AM/PM to 24-hour format
                    let [hours, minutes] = time.split(':');
                    hours = parseInt(hours);
                    minutes = parseInt(minutes.slice(0, 2));
                    if (time.includes('PM') && hours < 12) hours += 12;
                    if (time.includes('AM') && hours == 12) hours = 0;
                    
                    // If hour is negative, add 24 to get the correct hour; if hour is greater than 23, subtract 24
                    hours -= timezone;
                    if (hours < 0) {
                        hours += 24;
                        newReminder.deadline.setUTCDate(newReminder.deadline.getUTCDate() - 1);
                    }
                    // Set the time of the reminder to the timezone
                    newReminder.deadline.setUTCHours(hours);
                    newReminder.deadline.setUTCMinutes(minutes);
                    newReminder.deadline.setUTCSeconds(59);
                } else {
                    // If the reminder does not have a time, set the time to 23:59:59 of the timezone
                    let finalHour = 23 - timezone;
                    if (finalHour > 23) finalHour -= 24;
                    newReminder.deadline.setUTCHours(finalHour);
                    newReminder.deadline.setUTCMinutes(59);
                    newReminder.deadline.setUTCSeconds(59);
                }

                // Save the reminder in the database
                await newReminder.save();
                list.reminders.push(newReminder._id);
                await list.save();

                interaction.reply({ content: `Reminder "${category} - ${name}" added.` });
            }
        } catch (e) {
            console.log(e);
            interaction.reply({ 
                content: "There was an error adding the reminder.",
                ephemeral: true
            });
        }
    }
}