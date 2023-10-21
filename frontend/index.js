const recordButton = document.getElementById('record-button');
let mediaRecorder;
let chunks = [];

recordButton.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordButton.innerText = 'Sending...';
    return;
  }
  
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      recordButton.innerText = 'Stop';
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      chunks = [];

      // Stop recording after 59 seconds
      setTimeout(() => {
        mediaRecorder.stop();
      }, 60000);
      
      mediaRecorder.addEventListener('dataavailable', e => {
        chunks.push(e.data);
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        
        fetch('http://localhost:3000', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);
          recordButton.innerText = 'Record';
        })
        .catch(error => {
          console.error('Error:', error);
          recordButton.innerText = 'Record';
        });
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
});