const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: String,
  completed: { type: Boolean, default: false }
});

const noteSchema = new mongoose.Schema({
  heading: String,
  author: String,
  creationDate: { type: Date, default: Date.now },
  tags: [{ type: String }],
  completed: { type: Boolean, default: false },
  subtasks: [subtaskSchema]
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;    
