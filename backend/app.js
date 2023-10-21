const express = require('express')
const cors = require('cors');
const { SpeechClient } = require('@google-cloud/speech');
const { readFileSync } = require('fs');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

const key = JSON.parse(readFileSync('google-key.json'))
const projectId = 'prime-freedom-402713'
const speechClient = new SpeechClient({ credentials: key, projectId });
const app = express()
const port = 3000
const upload = multer();
const storage = new Storage({ credentials: key, projectId });
const bucket = storage.bucket('ejecutivoaudiofiles');

app.use(cors());

app.post('/', upload.single('audio'), async (req, res) => {
  try {
    // Retrieve the audio data sent from the SPA and store it in google cloud storage
    const file = req.file;
    const blob = bucket.file('audio.webm');
    const blobStream = blob.createWriteStream();
    blobStream.on('error', err => {
      console.log(err);
    });
    blobStream.end(file.buffer);

    // Set the audio content and encoding for the request
    const audio = {
      uri: 'gs://ejecutivoaudiofiles/audio.webm'
    };
    const config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: '16000',
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