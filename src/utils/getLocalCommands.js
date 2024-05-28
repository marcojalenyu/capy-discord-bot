const path = require("path");
const getAllfiles = require("./getAllFiles");

module.exports = (exceptions = []) => {
    let localCommands = [];

    const commandCategories = getAllfiles(
        path.join(__dirname, "..", "commands"),
        true
    )

    for (const commandCategory of commandCategories) {
        const commandFiles = getAllfiles(commandCategory);

        for (const commandFile of commandFiles) {
            const commandObjet = require(commandFile);

            if (exceptions.includes(commandObjet.name)) {
                continue;
            }

            localCommands.push(commandObjet);
        }
    }

    return localCommands;
}