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
            description: 'Display reminders with a specific deadline. Follow MM/DD or MM/DD/YYYY format.',
            type: ApplicationCommandOptionType.String,
        }
    ],

    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            // If the list is empty, return a message to the user
            if (!list || interaction.guildId != list.guildId) {
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
                // Check if the deadline is in the correct format
                if (deadline && (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || (year && (isNaN(year) || year.length != 4)))){
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

                // If category and deadline are not provided, show all reminders
                if (category === null && deadline === null) {
                    reminders = await Reminder.find({ listId: list._id });
                } else if (category && deadline === null) {
                    reminders = await Reminder.find({ listId: list._id, category: category });
                } else if (category === null && deadline) {
                    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
                    // Adjust the deadline to the user's timezone
                    startOfDay.setHours(startOfDay.getHours() - list.timezone);
                    endOfDay.setHours(endOfDay.getHours() - list.timezone);
                    reminders = await Reminder.find({ listId: list._id, deadline: { $gte: startOfDay, $lte: endOfDay } });
                } else {
                    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
                    // Adjust the deadline to the user's timezone
                    startOfDay.setHours(startOfDay.getHours() - list.timezone);
                    endOfDay.setHours(endOfDay.getHours() - list.timezone);
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
                                const deadline = new Date(reminder.deadline);
                                deadline.setHours(deadline.getHours() + list.timezone);
                                const [year, month, day] = [deadline.getUTCFullYear(), deadline.getUTCMonth() + 1, deadline.getUTCDate()];
                                // If the deadline is today, display "today"
                                if (day === today.getUTCDate() && month === today.getUTCMonth() + 1 && year === today.getUTCFullYear()) {
                                    message += `today`;
                                } else if (day === today.getUTCDate() + 1 && month === today.getUTCMonth() + 1 && year === today.getUTCFullYear()){
                                    message += `tomorrow`;
                                } else {
                                    message += `${month}/${day}`;
                                    // If the year is not the current year, display the year
                                    if (year !== today.getUTCFullYear()) {
                                        message += `/${year}`;
                                    }
                                }
                                // Display time 
                                let timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
                                // If time is not 23:59:59, display the time
                                if (deadline.getUTCHours() !== 23 || deadline.getUTCMinutes() !== 59 || deadline.getUTCSeconds() !== 59) {
                                    message += `, ${deadline.toLocaleTimeString('en-US', timeOptions)}`;
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