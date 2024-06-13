const Reminder = require('../models/Reminder');
const sendReminders = require('./sendReminders');

module.exports = async (client, list) => {
    try {
        const today = new Date();
        // Retrieve all reminders from the database that are past the deadline
        const reminders = await Reminder.find({ listId: list._id, deadline: { $lt: today } });
        // Delete all reminders that are past the deadline
        await Reminder.deleteMany({ listId: list._id, deadline: { $lt: today } });

        // Send a message to the channel where the list is registered
        sendReminders(client, list);

        // Check if there are reminders to delete
        if (reminders.length > 0) {
            // Delete all reminders that are past the deadline
            let message = `\nThe following reminders have been deleted:\n\n`;
            for (const reminder of reminders) {
                message += `• **${reminder.category}** - ${reminder.name}\n`;
            }

            // Send a message to the channel where the list is registered
            if (list.guildId) {
                const channel = await client.channels.fetch(list.channelId);
                channel.send(message);
            } else {
                const user = await client.users.fetch(list.userId);
                user.send(message);
            }
        }

    } catch (e) {
        console.error(e);
    }
}