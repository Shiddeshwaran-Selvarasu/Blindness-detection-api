const { exec } = require('child_process');
const express = require('express');
const { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const log = require('./loger.js');

const app = express();
const uploadDir = './uploads';

// Create the 'uploads' directory if it doesn't exist
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

// Set storage engine for multer
const storage = multer.memoryStorage(); // Store the image in memory for processing
const upload = multer({ storage: storage, dest: uploadDir }).array('images', 2); // 'images' is the field name, and 2 is the maximum number of files allowed

// Middleware to convert JPEG to PNG before storing
const convertToPng = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // Iterate through each uploaded file
    Promise.all(
      req.files.map((file) => {
        if (file.mimetype === 'image/jpeg') {
          // Use sharp to convert the image to PNG
          return sharp(file.buffer)
            .png()
            .toBuffer()
            .then((pngBuffer) => {
              file.buffer = pngBuffer;
              file.originalname = path.parse(file.originalname).name + '.png';
              file.mimetype = 'image/png';
            });
        } else {
          return Promise.resolve();
        }
      })
    )
      .then(() => next())
      .catch((err) => res.status(500).send('Error converting images to PNG'));
  } else {
    next();
  }
};

// Handle POST requests to /upload
app.post('/upload', upload, convertToPng, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No images uploaded');
  }

  // Save the converted images to the server
  req.files.forEach((file) => {
    const filePath = path.join(uploadDir, file.originalname);
    writeFileSync(filePath, file.buffer);
    console.log(`File saved: ${filePath}`);
  });

  res.send('Images uploaded and converted to PNG successfully!');
});

app.get('/process_image', (req, res) => {
  let filename = req.query.name;
  let result = {};

  if(!existsSync(path.join('./uploads', (filename + '_left.png'))) || !existsSync(path.join('./uploads', (filename + '_right.png')))) {
    result['message'] = 'please upload left and right images';
    res.send(result);
    return;
  }

  const predictor = exec(`python3 src/final_prediction_with_pre_trained_model.py ${filename}_left ${filename}_right`); 

  predictor.stdout.on('data', (data) => {
    log(data);
  });

  predictor.stderr.on('data', (data) => {
    log(data);
  });

  predictor.on("exit", (status) => {
    log(`Child process exited with code ${status}`);

    if (status == 1) {
      result["status"] = 'error';
    } else {
      result["status"] = 'success';
      try {
        result["data"] = JSON.parse(readFileSync(filename + '_result.json'));
        unlinkSync(filename + '_result.json');
      } catch (error) {
        result["data"] = 'failed to retrive data try again';
      }
    }
    
    res.send(result);
  });

  app.get('/clean', (req, res) => {
    let filename = req.query.name;
    let result = {};

    try {
      existsSync(path.join('./uploads', (filename + '_left.png'))) && unlinkSync(path.join('./uploads', (filename + '_left.png')));
      existsSync(path.join('./uploads', (filename + '_right.png'))) && unlinkSync(path.join('./uploads', (filename + '_right.png')));
      log('Removed files successfully...');
      result['status'] = 'done';
    } catch (error) {
      result['error'] = error.message;
    }

    res.send(result);
  });
});

module.exports = app;
