const Reminder = require('../models/Reminder');

module.exports = async (client, list) => {
    const reminders = await Reminder.find({ listId: list._id });
    
    if (reminders.length > 0) {
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

        // Send the message to the user or server
        if (list.userId) {
            client.users.cache.get(list.userId).send(message);
        } else {
            client.channels.cache.get(list.channelId).send(message);
        }
    }
}