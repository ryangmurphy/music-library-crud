const express = require("express");
const Database = require("better-sqlite3");
const Joi = require("joi");

const router = express.Router();
const db = Database(process.cwd() + '/database/chinook.sqlite');

// Define schemas for validation
const artistSchema = Joi.object({
  Name: Joi.string().min(2).required(),
});

//ROUTE ENDPOINTS HERE

// GET ALL ARTISTS
router.get("/", (req, res) => {
    // define a query to send to the database
    // Fetch artist from database
    const getArtists = db.prepare("SELECT * FROM artists");
    const artists = getArtists.all();
  
    res.json(artists);
  });

// GET ONE ARTIST
router.get("/:id", (req, res) => {
  //define a query to send to the database
  const getArtists = db.prepare("SELECT * FROM artists WHERE artistId = ?");
  const artists = getArtists.get(req.params.id);

  if (artists !== undefined) {
    res.json(artists);
  } else {
    res.status(404).send("No artist found");
  }
});

router.get(`/:artistId/albums`, (req, res) => {
  const getAlbums = db.prepare("SELECT * FROM Albums WHERE artistId = ?");
  const albums = getAlbums.all(req.params.artistId);

  if (albums.length !== undefined) {
    res.json(albums);
  } else {
    res.status(404).send("No albums found");
  }
});

// Creating or adding a new artist
router.post("/", (req, res) => {

  //access the payload of the new data that shoud arrive with the request
  //validate our req.body
  const {error} = artistSchema.validate(req.body, {abortEarly: false})
  if(error) {
      return res.status(422).send(error.details);
  }

    //validation passssed.... continue on
    const columns = [];
    const parameters = [];
    const values = [];

    console.log(req.body)
    for(key in req.body) {
        parameters.push('?');
        columns.push(key);
        values.push(req.body[key]);
    }

    //build db query that we can send to the db taht will enter a new record
    let sql = `INSERT INTO artists (${columns.join(', ')}) VALUES (${parameters.join(', ')});`
    const statement = db.prepare(sql)
    const result = statement.run([req.body.Name])

    console.log(result);
    res.status(201).json(result)
});

// Updating an existing artist
router.patch("/:id", (req, res) => {

    //Loop through each field in our req.body object
  //in order to dyanmically buiild out a portion of the UPDATE statement

  //validate our req.body
  const {error} = artistSchema.validate(req.body, {abortEarly: false})
  if(error) {
      return res.status(422).send(error.details);
  }
  const columns = [];
  const values = [];
  
  for(key in req.body) {
      //append our keys for our UPDATE statement
      columns.push(`${key} = ?`)
      //push the corresponding values into an array
      values.push(req.body[key])
  }

  //push id into the array
  values.push(req.params.id) 

  //json data will be availble in req.body
  const sql = `UPDATE artists SET ${columns.join(',')} WHERE ArtistId = ?;`
  console.log(sql)
  const statement = db.prepare(sql)
  const result = statement.run(values)

  //make sure  a record was indeed uipdated
  if(result.changes > 0) {
      res.json(result)
  } else {
      res.status(404).json(result)
  }

});

// Delete an artist
router.delete("/:id", (req, res) => {
//Remove any referenecs to the artists in the artists table
const deleteSql = "DELETE FROM artists WHERE artistId = ?;";
const deleteStatement = db.prepare(deleteSql);
const deleteResult = deleteStatement.run([req.params.id]);

//Make sure a record was indeed deleted
if (deleteResult.changes > 0) {
  res.json(deleteResult);
} else {
  res.status(404).json(deleteResult);
}
});



module.exports = router;  // Export router to app.js