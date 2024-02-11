const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const Joi = require("joi");


const router = express.Router();
const db = Database(process.cwd() + '/database/chinook.sqlite');

// Define schemas for validation
const albumSchema = Joi.object({
  Title: Joi.string().min(2).required(),
  ReleaseYear: Joi.number().integer().min(1900).max(2050),
  ArtistId: Joi.number().integer().required()
});

//ROUTE ENDPOINTS HERE

// GET ALL ALBUMS

router.get("/", (req, res) => {
    const getAlbums = db.prepare("SELECT * FROM albums");
    const albums = getAlbums.all();
  
    res.json(albums);
  });
  
// GET ONE ALBUM
router.get('/:artistId/albums', (req, res) => {
    const getAlbums = db.prepare("SELECT * FROM Albums WHERE artistId = ?");
    const albums = getAlbums.all(req.params.artistId);
  
    if (albums.length !== undefined) {
      res.json(albums);
    } else {
      res.status(404).send("No albums found");
    }
  });

  
//GET TRACKS BASED ON ALBUM
router.get("/:albumId/tracks", (req, res) => {
    const getTracks = db.prepare("SELECT * FROM tracks WHERE albumId = ?");
    const tracks = getTracks.all(req.params.albumId);
  
    if (tracks.length !== undefined) {
      res.json(tracks);
    } else {
      res.status(404).send("No tracks found");
    }
  });


//Create an endpoint to update an exisiting albumart
router.patch("/:albumId/albumart", (req, res) => {
  //Loop through each field in our req.body object
  //in order to dyanmically buiild out a portion of the UPDATE statement
  
  let setValues = "";
  const values = [];
  for (key in req.body) {
    //append our keys for our UPDATE statement
    setValues += `${key} = ?,`;
    //push the corresponding values into an array
    values.push(req.body[key]);
  }

  //push id into the array
  values.push(req.params.albumId);

  setValues = setValues.slice(0, -1); //remove trailing comma from string

  //json data will be availble in req.body
  const sql = `UPDATE albums SET AlbumArt = ? WHERE AlbumId = ?;`;
  const statement = db.prepare(sql);
  const result = statement.run(values);

  //make sure  a record was ineed updated
  if (result.changes > 0) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

//endpoint to handle file upload
const storage = multer.diskStorage({
  destination: "./_FrontendStarterFiles/albumart",
  filename: function (req, file, cb) {
    albumartName = Date.now().toString() + path.extname(file.originalname);
    cb(null, albumartName);
  },
});

const upload = multer({ storage: storage });

router.post("/:albumId/albumart", upload.single("albumart"), (req, res) => {
    //build db query that we can send to the db that will enter a new record
    let sql = `UPDATE albums SET AlbumArt = '${albumartName}' WHERE AlbumId = ?;`;
    const statement = db.prepare(sql);
    const result = statement.run(req.params.albumId);

    // send json results
    res.status(201).json(result);
    console.log(result);
  }
); 

// GET ALL ALBUMS
router.get("/:id", (req, res) => {
  try {
    const getAlbums = db.prepare("SELECT * FROM albums");
    const albums = getAlbums.all();
    res.json(albums);
  } catch (error) {
    console.error("Error fetching albums data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create or add an album
router.post("/", (req, res) => {
    //access the payload of the new data that shoud arrive with the request
    //validate our req.body
    const {error} = albumSchema.validate(req.body, {abortEarly: false})
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
      let sql = `INSERT INTO albums (${columns.join(', ')}) VALUES (${parameters.join(', ')});`;
      const statement = db.prepare(sql)
      const result = statement.run(values)
  
      if (result.changes > 0) {
        res.status(201).json(result);
      } else {
        res.status(500).send("Error creating album");
      }
    });

// Update an existing album
router.patch("/:id", (req, res) => {

    //Loop through each field in our req.body object
    //in order to dyanmically buiild out a portion of the UPDATE statement

    //validate our req.body
    const {error} = albumSchema.validate(req.body, {abortEarly: false})
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
    const sql = `UPDATE albums SET ${columns.join(',')} WHERE AlbumId = ?;`
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

// Delete an album
router.delete("/:id", (req, res) => {
  //Remove any referenecs to the albums in the albums table
  const deleteSql = "DELETE FROM albums WHERE albumId = ?;";
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