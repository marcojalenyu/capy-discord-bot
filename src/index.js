require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({ 
    intents: [ 
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', () => {
    console.log(`${client.user.tag} is online.`);
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return; 
    console.log(interaction.commandName);

    if (interaction.commandName === 'add') {
        const num1 = interaction.options.getNumber('num1');
        const num2 = interaction.options.getNumber('num2');
        const sum = num1 + num2;
        interaction.reply(`The sum of ${num1} and ${num2} is ${sum}`);
    }
});

client.login(process.env.TOKEN);