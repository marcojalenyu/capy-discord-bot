require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
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
            const currentTime = `${now.getHours()}:${now.getMinutes()}`;
            const lists = await List.find({ remindTime: currentTime });

            for (const list of lists) {
                console.log("Updating reminders for list: ", list._id);
                updateReminders(client, list);
            }
            
        }, 60 * 1000);
    
    } catch (error) {
        console.error('Error connecting to MongoDB');
    }
})();

client.login(process.env.TOKEN);