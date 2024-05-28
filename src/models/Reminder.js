const { Schema, model } = require('mongoose');
const { description } = require('../commands/misc/ping');

/**
 * This schema represents a Reminder.
 */
const reminderSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    listId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'List'
    },
    category: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    deadline: {
        type: Date,
        required: true
    },
    type : {
        type: String,
        default: 'task'
    },
});

module.exports = model('Reminder', reminderSchema);