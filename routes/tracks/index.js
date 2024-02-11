const express = require("express");
const Database = require("better-sqlite3");
const Joi = require("joi");

const router = express.Router();
const db = Database(process.cwd() + "/database/chinook.sqlite");

const trackSchema = Joi.object({
  Name: Joi.string().min(2).required(),
  MediaTypeId: Joi.number().integer().min(1).max(5).required(),
  Milliseconds: Joi.number().integer().min(1).max(10000000).required(),
  AlbumId: Joi.number().integer().min(1).max(10000000).required(),
});

// GET MEDIA TYPES
router.get("/api/mediatypes", (req, res) => {
  const getMediaTypes = db.prepare("SELECT * FROM media_types");
  const mediaTypes = getMediaTypes.all();

  res.json(mediaTypes);
});


// GET ALL TRACKS
router.get("/:id", (req, res) => {
  try {
    const getTracks = db.prepare("SELECT * FROM tracks");
    const tracks = getTracks.all();
    res.json(tracks);
  } catch (error) {
    console.error("Error fetching track data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create or add a track
router.post("/", (req, res) => {
  //access the payload of the new data that shoud arrive with the request
  //validate our req.body
  const { error } = trackSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).send(error.details);
  }
  //validation passssed.... continue on
  const columns = [];
  const parameters = [];
  const values = [];

  console.log(req.body);
  for (key in req.body) {
    parameters.push("?");
    columns.push(key);
    values.push(req.body[key]);
  }

  //build db query that we can send to the db taht will enter a new record
  let sql = `INSERT INTO tracks (${columns.join(
    ", "
  )}) VALUES (${parameters.join(", ")});`;
  const statement = db.prepare(sql);
  const result = statement.run(values);

  if (result.changes > 0) {
    res.status(201).json(result);
  } else {
    res.status(500).send("Error creating track");
  }
});

// Update an existing track
router.patch("/:id", (req, res) => {
  //Loop through each field in our req.body object
  //in order to dyanmically buiild out a portion of the UPDATE statement

  //validate our req.body
  const { error } = trackSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).send(error.details);
  }
  const columns = [];
  const values = [];

  for (key in req.body) {
    //append our keys for our UPDATE statement
    columns.push(`${key} = ?`);
    //push the corresponding values into an array
    values.push(req.body[key]);
  }

  //push id into the array
  values.push(req.params.id);

  //json data will be availble in req.body
  const sql = `UPDATE tracks SET ${columns.join(",")} WHERE TrackId = ?;`;
  console.log(sql);
  const statement = db.prepare(sql);
  const result = statement.run(values);

  //make sure  a record was indeed uipdated
  if (result.changes > 0) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// Delete a track
router.delete("/:id", (req, res) => {
  //Remove any referenecs to the tracks in the albums table
  const deleteSql = "DELETE FROM tracks WHERE trackId = ?;";
  const deleteStatement = db.prepare(deleteSql);
  const deleteResult = deleteStatement.run([req.params.id]);

  //Make sure a record was indeed deleted
  if (deleteResult.changes > 0) {
    res.json(deleteResult);
  } else {
    res.status(404).json(deleteResult);
  }
});

module.exports = router; // Export router to app.js
