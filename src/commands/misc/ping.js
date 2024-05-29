module.exports = {
    name: 'ping',
    description: 'Pong!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // options; Object[],

    callback: (client, interaction) => {
        console.log(interaction)
        interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
}