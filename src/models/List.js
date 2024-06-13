const { Schema, model } = require('mongoose');

/**
 * This schema represents a list of of reminders.
 * It is unique per Discord server.
 */
const listSchema = new Schema({
    guildId: {
        type: String,
        default: null
    },
    userId: {
        type: String,
        default: null
    },
    channelId: {
        type: String,
        default: null
    },
    reminders: {
        type: [{
            type: Schema.Types.ObjectId,
        }],
        default: [],
        required: true
    },
    remindTime: {
        type: Date,
        default: null,
        required: true
    },
    timezone: {
        type: Number,
        default: 0,
        required: true
    }
});

module.exports = model('List', listSchema);