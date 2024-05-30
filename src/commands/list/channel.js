const List = require("../../models/List");

module.exports = {
    name: 'channel',
    description: 'Change the channel where the daily list is sent.',

    callback: async (client, interaction) => {
        try {
            const list = await List.findOne({ guildId: interaction.guildId }) || await List.findOne({ userId: interaction.user.id });
            if (!list || interaction.guildId != list.guildId) {
                interaction.reply({
                    content: "You do not have a list registered.",
                    ephemeral: true
                });
                return;
            } else {
                // Check if the list is a guild list
                if (list.guildId) {
                    list.channelId = interaction.channelId;
                    await list.save();
                    interaction.reply({
                        content: "Daily list channel changed.",
                        ephemeral: true
                    });
                } else {
                    interaction.reply({
                        content: "This command is only valid for lists in servers.",
                        ephemeral: true
                    });
                }
            }
        } catch (e) {
            interaction.reply({
                content: "There was an error setting the daily list channel.",
                ephemeral: true
            });
        }
    }
}