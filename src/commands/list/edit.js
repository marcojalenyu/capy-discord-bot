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
                        const [month, day, year] = value.split('/');
                        reminder.deadline = new Date(Date.UTC(year, month - 1, day));
                        reminder.deadline.setUTCHours(23);
                        reminder.deadline.setUTCMinutes(59);
                        reminder.deadline.setUTCSeconds(59);
                        break;
                    case 'time':
                        const [hours, minutes] = value.split(':').map(Number);
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