// Schema per le note

const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
    title: String,
    completed: { type: Boolean, default: false }
});

const noteSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    heading: String,
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creationDate: { type: Date, default: Date.now },
    lastEditDate: { type: Date, default: Date.now },
    tags: {
        type: [String],
        validate: {
            // Questo validatore controlla che ogni tag sia una stringa non vuota dopo aver rimosso gli spazi iniziali e finali
            validator: (tags) => tags.every((tag) => typeof tag === 'string' && tag.trim().length > 0),
            message: 'Tutti i tag devono essere stringhe non vuote',
        },
    },
    
    //subtasks: [subtaskSchema] // Aggiunta dell'array di subtask
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
