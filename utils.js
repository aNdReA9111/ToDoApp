const mongoose = require('mongoose');
const Note = require('./models/Note.js'); // Assicurati di includere il percorso corretto al file contenente il modello Note

// Connessione al database MongoDB
mongoose.connect("mongodb+srv://andrea:P9G3xICShr4H5dY9@cluster0.zvc2wry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connessione al database avvenuta con successo');

        // Esempi di dati delle note
        const notesData = [
            {
                heading: "Fare la spesa",
                content: "Comprare alimenti per la settimana",
                author: "andrea", // Sostituisci con l'ID dell'autore reale
                tags: ["spesa", "casa"],
                subtasks: [
                    { title: "Comprare latte", completed: false },
                    { title: "Comprare pane", completed: false },
                    { title: "Comprare frutta e verdura", completed: false }
                ]
            },
            {
                heading: "Finire progetto",
                content: "Lavorare sul progetto fino al completamento",
                author: "andrea", // Sostituisci con l'ID dell'autore reale
                tags: ["progetto", "lavoro"],
                subtasks: [
                    { title: "Fase 1", completed: false },
                    { title: "Fase 2", completed: false }
                ]
            }
        ];

        // Salvataggio delle note nel database
        return Note.insertMany(notesData);
    })
    .then((insertedNotes) => {
        console.log('Le note sono state inserite nel database con successo:', insertedNotes);
        mongoose.disconnect(); // Chiudi la connessione al database dopo aver inserito i dati
    })
    .catch((error) => {
        console.error('Si è verificato un errore durante il popolamento del database:', error);
    });
