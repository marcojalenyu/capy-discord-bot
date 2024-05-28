module.exports = {
    name: 'ping',
    description: 'Pong!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // options; Object[],
    // deleted: Boolean,

    callback: (client, interaction) => {
        console.log(interaction)
        interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
}