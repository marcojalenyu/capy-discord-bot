const { Schema, model } = require('mongoose');
const { description } = require('../commands/misc/ping');

/**
 * This schema represents a Reminder.
 */
const reminderSchema = new Schema({
    listId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'List'
    },
    category: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    deadline: {
        type: Date,
        required: true
    },
    type : {
        type: String,
    },
});

module.exports = model('Reminder', reminderSchema);