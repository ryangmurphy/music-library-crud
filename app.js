const express = require("express");
const Database = require("better-sqlite3");
const morgan = require("morgan");
const path = require("path");


// IMPORT ANY ROUTER MODULES
const artistsRouter = require("./routes/artists"); // Will look for index.js
const albumsRouter = require("./routes/albums"); // Will look for index.js
const tracksRouter = require("./routes/tracks"); // Will look for index.js

const db = Database(__dirname + "/database/chinook.sqlite");

// Create instance of an express app
const app = express();

// Configure folder to serve Static Server
app.use(morgan("tiny"));
app.use(express.static("_FrontendStarterFiles"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//INJECT our routers into app
app.use('/api/artists', artistsRouter)
app.use('/api/albums', albumsRouter)
app.use('/api/tracks', tracksRouter)

// GET MEDIA TYPES
app.get("/api/mediatypes", (req, res) => {
  const getMediaTypes = db.prepare("SELECT * FROM media_types");
  const mediaTypes = getMediaTypes.all();

  res.json(mediaTypes);
});

// GET Themes
app.get("/api/themes", (req, res) => {
  const getThemes = db.prepare("SELECT * FROM themes");
  const themes = getThemes.all();
  res.json(themes);
});

//server start
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
