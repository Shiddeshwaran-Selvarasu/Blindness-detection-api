const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage
}).single('image');

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send('Image uploaded successfully!');
  });
});

app.get('/process_image', (req, res) => {
  res.send('done');
});

module.exports = app;
