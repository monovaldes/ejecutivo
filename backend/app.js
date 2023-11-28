const express = require('express')
const cors = require('cors');
const { SpeechClient } = require('@google-cloud/speech');
const { readFileSync } = require('fs');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');

const key = JSON.parse(process.env.GOOGLE_API_KEY)
const projectId = 'prime-freedom-402713'
const speechClient = new SpeechClient({ credentials: key, projectId });
const app = express()
const port = 8080
const upload = multer({dest: '/tmp/ejecutivo/'});
const storage = new Storage({ credentials: key, projectId });
const bucket = storage.bucket('ejecutivoweb');

app.use(cors());

app.post('/', upload.single('audio'), async (req, res) => {
  try {
    // Simple API Key authentication
    const apiKey = req.body.api_key;
    // using a random md5 hash as the fallback API key for now
    const validApiKey = process.env.API_KEY || '5cbd71ebb6f4cc93391abd8ca3e5f8e9';

    if (!apiKey || apiKey !== validApiKey) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    } 

    const uploadedFilePath = req.file.path;
    
    // Convert the MP4 audio file to WAV format using fluent-ffmpeg
    const outputPath = '/tmp/converted-audio.wav';


    const convertToWav = (uploadedFilePath, outputPath) => {
      return new Promise((resolve, reject) => {
        ffmpeg(uploadedFilePath)
          .toFormat('wav')
          .on('end', () => {
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Conversion error:', err);
            reject(err);
          })
          .save(outputPath);
      });
    }

    try {
      await convertToWav(uploadedFilePath, outputPath);
    } catch(err) {
      res.status(500).json({ error: err });
      return;
    }

    // store the converted file in google cloud storage
    const file = readFileSync(outputPath);
    const blob = bucket.file('audio.wav');
    const blobStream = blob.createWriteStream();

    blobStream.on('error', err => {
      console.error('Error writing to blobStream:', err);
    });

    blobStream.end(file);
    
    // Set the audio content and encoding for the request
    const audio = {
      uri: 'gs://ejecutivoweb/audio.wav'
    };
    const config = {
      languageCode: 'es-CL',
    };

    const request = {
      audio: audio,
      config: config,
    };

    // Transcribe the audio using the Google Speech API
    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    // Send the transcription back to the frontend
    res.json({ transcription });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Transcription failed' });
  }

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})