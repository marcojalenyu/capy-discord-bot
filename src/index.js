require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const keep_alive = require('./keep_alive');
const List = require('./models/List');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const updateReminders = require('./utils/updateReminders');

const client = new Client({ 
    intents: [ 
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

(async () => {
    try {
        mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        eventHandler(client);
        // Checks if it is time to remind the user (every minute)
        setInterval(async () => {
            const now = new Date();
            // Find lists whose remindTime is less than or equal to the current time
            const lists = await List.find({ remindTime: { $lte: now } });
            for (const list of lists) {
                console.log("Updating reminders for list: ", list._id);
                updateReminders(client, list);
                // Set the remindTime to the next day
                const [hours, minutes] = [list.remindTime.getUTCHours(), list.remindTime.getUTCMinutes()];
                list.remindTime = new Date().setUTCHours(hours, minutes, 0, 0) + 86400000;
                list.markModified('remindTime');
                await list.save();
            }
        }, 60 * 1000);
    } catch (error) {
        console.error('Error connecting to MongoDB');
    }
})();

client.login(process.env.TOKEN);