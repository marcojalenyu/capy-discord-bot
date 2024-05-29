const { ApplicationCommandOptionType } = require('discord.js');
const List = require('../../models/List');
const Reminder = require('../../models/Reminder');

module.exports = {
    name: 'show',
    description: 'Show all reminders.', 
    options: [
        {
            name: 'category',
            description: 'Display reminders from a specific category.',
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'deadline',
            description: 'Display reminders with a specific deadline. Must follow MM/DD/YYYY format.',
            type: ApplicationCommandOptionType.String,
        }
    ],

    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // If the list is empty, return a message to the user
            if (!list) {
                interaction.reply({ 
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                // Get the category and deadline from the interaction
                const category = interaction.options.getString('category');
                const deadline = interaction.options.getString('deadline');
                let reminders;

                // Split the deadline into month, day, and year
                let [month, day, year] = deadline ? deadline.split('/').map(Number) : [null, null, null];

                // If category and deadline are not provided, show all reminders
                if (category === null && deadline === null) {
                    reminders = await Reminder.find({ listId: list._id });
                } else if (category && deadline === null) {
                    reminders = await Reminder.find({ listId: list._id, category: category });
                } else if (category === null && deadline) {
                    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
                    reminders = await Reminder.find({ listId: list._id, deadline: { $gte: startOfDay, $lte: endOfDay } });
                } else {
                    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
                    reminders = await Reminder.find({ listId: list._id, category: category, deadline: { $gte: startOfDay, $lte: endOfDay } });
                }

                // If there are no reminders, return a message to the user
                if (reminders.length === 0) {
                    interaction.reply({ 
                        content: "There are no reminders to show.",
                        ephemeral: true
                    });
                    return;
                } else {
                    // Group the reminders by category
                    const groupedReminders = reminders.reduce((acc, reminder) => {
                        if (!acc[reminder.category]) {
                            acc[reminder.category] = [];
                        }
                        acc[reminder.category].push(reminder);
                        return acc;
                    }, {});

                    // Sort the categories by earliest deadline
                    for (const category in groupedReminders) {
                        groupedReminders[category].sort((a, b) => a.deadline - b.deadline);
                    }

                    // Sort the reminders in each category by deadline, then by name
                    for (const category in groupedReminders) {
                        groupedReminders[category].sort((a, b) => {
                            if (a.deadline - b.deadline === 0) {
                                return a.name.localeCompare(b.name);
                            }
                            return a.deadline - b.deadline;
                        });
                    }

                    // Create a message to display the reminders
                    // Format: Name - Description (if available), due/on (due if task, on if event) Deadline (if available), Time (if available)
                    const today = new Date();
                    let message = `DATE: **${today.getUTCMonth() + 1}/${today.getUTCDate()}**\n\n`;
                    for (const category in groupedReminders) {
                        message += `[${category}]\n`;
                        for (const reminder of groupedReminders[category]) {
                            message += `• **${reminder.name}** - `;
                            if (reminder.description) {
                                message += `${reminder.description}, `;
                            }
                            if (reminder.deadline) {
                                message += `${reminder.type === 'task' ? 'due' : 'on'} `;
                                // Get the date components in UTC
                                let year = reminder.deadline.getUTCFullYear();
                                let month = reminder.deadline.getUTCMonth() + 1; // Months are 0-based
                                let day = reminder.deadline.getUTCDate();
                                // Format the date
                                // If the deadline is today, display "today"
                                if (today.getUTCFullYear() === year && today.getUTCMonth() === reminder.deadline.getUTCMonth() && today.getUTCDate() === reminder.deadline.getUTCDate()) {
                                    message += `today`;
                                } else if (today.getUTCFullYear() === year && today.getUTCMonth() === reminder.deadline.getUTCMonth() && today.getUTCDate() === reminder.deadline.getUTCDate() - 1) {
                                    message += `tomorrow`;
                                } else {
                                    message += `${month}/${day}`;
                                }
                                // Display time 
                                let timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
                                // If time is not 23:59:59, display the time
                                if (reminder.deadline.getUTCHours() !== 23 || reminder.deadline.getUTCMinutes() !== 59 || reminder.deadline.getUTCSeconds() !== 59) {
                                    message += `, ${reminder.deadline.toLocaleTimeString('en-US', timeOptions)}`;
                                }
                            }
                            message += `\n`;
                        }
                        message += `\n`;
                    }

                    // Send the message to the user
                    interaction.reply({ content: message, ephemeral: true });
                }

            }
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: 'An error occurred while processing this command.', ephemeral: true });
        }
    }
}