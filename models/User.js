// Modello utenti

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = User;

/*

{
  _id:{"$oid":"6631978d03c9e88ddf067dac"}
  heading: "Fare la spesa",
  content: "Comprare alimenti per la settimana",
  author: ObjectId("6631962d03c9e88ddf067daa"),
  creationDate: new Date(),
  lastEditDate: new Date(),
  tags: ["spesa", "casa"],
  subtasks: [
      { title: "Comprare latte", completed: false },
      { title: "Comprare pane", completed: false },
      { title: "Comprare frutta e verdura", completed: false }
  ]
}

{"_id":{"$oid":"66319a1f03c9e88ddf067dae"},
  "heading":"Fare la spesa",
  "content":"Comprare roba per la settimana",
  "author":{"$oid":"6631962d03c9e88ddf067daa"},
  "creationDate":{"$timestamp":{"t":0,"i":0}},
  "lastEditDate":{"$timestamp":{"t":0,"i":0}},
  "tags":["spesa","casa"]
	"subtasks":[
    {"title":"test"}
  ]} 
}

*/