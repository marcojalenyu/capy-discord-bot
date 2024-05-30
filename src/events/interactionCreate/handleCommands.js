require('dotenv').config();
const devs = process.env.DEVS.split(',');
const testServer = process.env.TEST_SERVER;
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client, interaction) => {
    if (!interaction.isCommand()) return;

    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find((command) => command.name === interaction.commandName);

        if (!commandObject) return;

        if (commandObject.devOnly && !devs.includes(interaction.user.id)) { 
            interaction.reply({ 
                content: "Only developers are allowed to run this command.", 
                ephemeral: true 
            });
            return;
        }

        if (commandObject.testOnly && interaction.guildId !== testServer) { 
            interaction.reply({ 
                content: "This command cannot be ran here.", 
                ephemeral: true 
            });
            return;
        }

        if (commandObject.botPermissions?.length) {
            for (const permission of commandObject.botPermissions) {
                const bot = interaction.guild.members.me;

                if (!bot.permissions.has(permission)) {
                    interaction.reply({ 
                        content: `I need the \`${permission}\` permission to run this command.`, 
                        ephemeral: true 
                    });
                    return;
                }
            }
        }

        await commandObject.callback(client, interaction);

    } catch (error) {
        console.error("There was an error handling the command.");
    }
};
