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
            description: 'Must follow MM/DD/YYYY format.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'time',
            description: 'Must follow HH:MM format.',
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
            if (!list) {
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

                // Split the deadline into month, day, and year
                const [month, day, year] = deadline.split('/');
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
                if (time) {
                    const [hours, minutes] = time.split(':');
                    newReminder.deadline.setUTCHours(hours);
                    newReminder.deadline.setUTCMinutes(minutes);
                    newReminder.deadline.setUTCSeconds(59);
                } else {
                    newReminder.deadline.setUTCHours(23);
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