require("dotenv").config();

const express = require("express");

const mongoose = require("mongoose");
const path = require("path");

// middleware
const cors = require('cors');    // Cross-origin resource
const passport = require("passport"); // Autenticazione
const LocalStrategy = require("passport-local").Strategy;
const session = require('express-session'); // Sessione per Express
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

// moduli
const User = require('./models/User');
const Note = require('./models/Note');

// levare eventuali tag da stringhe
const stripHtmlTags = (text) => text.replace(/<\/?[^>]+(>|$)/g, ""); // Function to strip HTML tags


const app = express();

// Middleware setup
app.use(cors());
app.set("view engine", "ejs"); // Set EJS as the view engine
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to 'true' only for HTTPS
  })
);
  
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash(); // Make flash messages available in views
  res.locals.username = req.isAuthenticated() ? req.user.username : null; // Provide username if authenticated
  next(); // Continue with the next middleware
});


// Connessione al database
mongoose.connect(process.env.DB_URI);
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


// Passport setup for user authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return done(null, false, { message: "Username o password incorretti." });
    }
    return done(null, user);
  })
);
  
// Serializzazione e deserializzazione dell'utente
passport.serializeUser((user, done) => {
  done(null, user._id);
});
  
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// middleware per mantenere l'autenticazione dell'utente
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated
  }
  res.redirect("/login"); // Redirect if not authenticated
};

app.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })

    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found"); // If user is not found
    }

    const posts = await Note.find({ author: user.username });

    res.render("home", {
      posts: posts.map((post) => ({
        ...post.toObject(), // Convert Mongoose document to plain object
      })),
      username: user.username, // Pass username to the template
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Error fetching posts."); // Handle errors
  }
});

app.get("/login", (req, res) => {
    res.render("login");
});

// https://betaweb.github.io/flashjs/ ma non implementato nella versione corrente
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
}));

app.get("/register", (req, res) => {
  res.render("register", { username: req.user ? req.user.username : null });
});
  
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword, // Store the hashed password
    });

    await newUser.save();

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).send("Error during login after registration.");
      }

      res.redirect("/"); // Redirect after successful registration
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Registration failed."); // Handle registration errors
  }
});

app.post("/notes/delete/:username/:id", ensureAuthenticated, async (req, res) => {
  const nota = await Note.findById(req.params.id);

  if (!nota) {  return res.status(404).send("Post not found"); }

  if (nota.author !== req.user.username) 
    return res.status(403).send("Non hai i permessi per cancellare la nota.");
  
  await Note.findByIdAndDelete(req.params.id);
  res.redirect('/');
  
});

app.post("/notes/delete/:username/:id/:index", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const index = parseInt(req.params.index, 10);

    const nota = await Note.findById(id);

    if (!nota) {  return res.status(404).send("Post not found"); }

    if (nota.author !== req.user.username) 
      return res.status(403).send("Non hai i permessi per cancellare la nota.");

    if (nota.subtasks.length > index && index >= 0) {
      if (nota.subtasks[index]) {
        nota.subtasks.splice(index, 1);
        await Note.findByIdAndUpdate(id, {subtasks: nota.subtasks}, {new: true});
        res.redirect(`/`);
      } else {
        res.status(400).send("Invalid subtask index");
      }
    } else {
      res.status(400).send("Invalid subtask index");
    }
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
  
});


app.get("/notes/:postId", ensureAuthenticated, async (req, res) => {
  try {
    const post = await Note.findById(req.params.postId);

    if (!post) {  return res.status(404).send("Post not found");  }

    res.render("notes", {post});
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).send("Error fetching post.");
  }
});


app.post("/notes/:id/:index/:stat", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const index = parseInt(req.params.index, 10);
    const stat = req.params.stat === 'true';

    const post = await Note.findById(id);

    if (!post) {  return res.status(404).send("Post not found"); }

    if (post.subtasks.length > index && index >= 0) {
      if (post.subtasks[index]) {
        post.subtasks[index].completed = !stat;
        if(stat)
          post.completed = false;
        await Note.findByIdAndUpdate(id, {subtasks: post.subtasks, completed: post.completed}, {new: true});
        res.redirect(`/`);
      } else {
        res.status(400).send("Invalid subtask index");
      }
    } else {
      res.status(400).send("Invalid subtask index");
    }
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
});

app.post("/notes/:id/:stat", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const stat = req.params.stat === 'true';

    const post = await Note.findById(id);

    if (!post) return res.status(404).send("Post not found");

    for(let i=0; i<post.subtasks.length && !stat; ++i)
      post.subtasks[i].completed = true;
    
   
    await Note.findByIdAndUpdate(id, {subtasks: post.subtasks, completed: !stat}, {new: true});
    res.redirect(`/`);

  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
});


app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Error during logout.");
    }

    res.redirect(302, "/login"); // Use a valid status code and clear redirect
  });
});


app.post("/edit/:id", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { title } = req.body;

    const post = await Note.findById(id);

    if (!post) return res.status(404).send("Post not found");

    if (post.author !== req.user.username) 
      return res.status(403).send("Non hai i permessi per modificare la nota.");
    
    await Note.findByIdAndUpdate(id, {heading: title}, {new: true});
    res.redirect(`/`);

  } catch (error) {
    console.log("Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
});


app.post("/addNote", ensureAuthenticated, async (req, res) => {
  try {
    const { title } = req.body;

    const newNote = new Note({
      heading: title,
      content: "Tes",
      author: req.user.username,
      subtasks: []
    });

    await newNote.save();

    res.redirect(`/`);

  } catch (error) {
    console.log("Error saving new note:", error);
    res.status(500).send("Error saving new note.");
  }
});



app.post("/addSubNote/:id", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { task } = req.body;


    const post = await Note.findById(id);

    if (!post) return res.status(404).send("Post not found");

    if (post.author !== req.user.username) 
      return res.status(403).send("Non hai i permessi per aggiungere una sottonota.");
    
    post.subtasks.push({
      title: task
    });

    await Note.findByIdAndUpdate(id, {subtasks: post.subtasks}, {new: true});
    res.redirect(`/`);

  } catch (error) {
    console.log("Error adding subtask:", error);
    res.status(500).send("Error adding subtask.");
  }
});


app.post("/addTag/:username/:id/", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    let {tag} = req.body;
    tag = tag.trim().toLowerCase();
    

    const nota = await Note.findById(id);

    if (!nota) return res.status(404).send("Post not found");

    if (nota.author !== req.user.username) 
      return res.status(403).send("Non hai i permessi per aggiungere o eliminare tag.");
    
    if(!nota.tags.includes(tag))
      nota.tags.push(tag);

    await Note.findByIdAndUpdate(id, {tags: nota.tags}, {new: true});
    res.redirect(`/`);
    

  } catch (error) {
    console.log("Error adding tag:", error);
    res.status(500).send("Error adding tag.");
  }
});

app.post("/deleteTag/:username/:id/:index", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const index = parseInt(req.params.index, 10);

    const nota = await Note.findById(id);

    if (!nota) return res.status(404).send("Post not found");

    if (nota.author !== req.user.username) 
      return res.status(403).send("Non hai i permessi per aggiungere o eliminare tag.");
    
    if(index < 0 || index >= nota.tags.length)
      return res.status(400).send("Indice non valido.");
    
    nota.tags.splice(index, 1);

    await Note.findByIdAndUpdate(id, {tags: nota.tags}, {new: true});
    res.redirect(`/`);

  } catch (error) {
    console.log("Error adding tag:", error);
    res.status(500).send("Error adding tag.");
  }
});



// Listen on default port 
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
});