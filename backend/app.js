const express = require('express')
const cors = require('cors');
const { SpeechClient } = require('@google-cloud/speech');
const { readFileSync } = require('fs');
const multer = require('multer');

const key = JSON.parse(readFileSync('google-key.json'))
const projectId = 'prime-freedom-402713'
const speechClient = new SpeechClient({ credentials: key, projectId });
const app = express()
const port = 3000
const upload = multer();

app.use(cors());

app.post('/', upload.single('audio'), async (req, res) => {
  try {
    // Retrieve the audio data sent from the SPA
    const audioBuffer = req.file.buffer;

    // Set the audio content and encoding for the request
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    const config = {
      encoding: 'WEBM_OPUS',
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