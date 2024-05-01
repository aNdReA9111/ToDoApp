const express = require("express");

const mongoose = require("mongoose");
const path = require("path");

// middleware
const cors = require('cors');    // Cross-origin resource
const passport = require("passport"); // Autenticazione
const session = require('express-session'); // Sessione per Express

// moduli
const User = require('./models/User');
const Note = require('./models/Note');

// connessione db + app
//"P9G3xICShr4H5dY9"
const URI = "mongodb+srv://andrea:P9G3xICShr4H5dY9@cluster0.zvc2wry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const app = express();

// Middleware setup
app.use(cors());
app.set("view engine", "ejs"); // Set EJS as the view engine
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


// Connessione al database
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("connected", () => console.log("Connesso a MongoDB"));
mongoose.connection.on("reconnected", () => console.log("Riconnesso a MongoDB"));
mongoose.connection.on("disconnected", () => console.log("Disconnesso da MongoDB"));
mongoose.connection.on("error", (err) => console.error("Errore di connessione:", err));


// Close MongoDB connection on SIGINT (Ctrl+C)
process.on("SIGINT", () => {
    mongoose.connection.close(() => {
        console.log("Chiudo la connessione e termino l'app");
        process.exit(0);
    });
});


// Content variables
const homeContent = "This is Home";
const aboutContent = "This is About";
const contactContent = "This is Contact";


app.get("/", async (req, res) => {
    try {
        const posts = await Note.find({});
        res.render("home", { content: homeContent, posts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching posts');
    }
});












// Listen on default port 3000
app.listen(3000, () => {
    console.log("Server on http://localhost:3000");
});