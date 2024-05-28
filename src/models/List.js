const { Schema, model } = require('mongoose');

/**
 * This schema represents a list of of reminders.
 * It is unique per Discord server.
 */
const listSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },    
    guildId: {
        type: String,
        required: true
    },
    reminders: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'Reminder'
        }],
        required: true
    }
});

module.exports = model('List', listSchema);