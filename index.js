const recordButton = document.getElementById('record-button');
const apiKeyInput = document.getElementById('api-key')
const result = document.getElementById('result')
const recognized = document.getElementById('recognized')
const incorrectEl = document.getElementById('incorrect')

let mediaRecorder;
let chunks = [];
WORDS = [
  //  A
  'armonía', 'agrupación', 'asociación', 'abeja', 'arveja',
  'anteojos', 'antiparras', 'ancla', 'alcaparra', 'aceptar',
  'aceptación', 'ancestro', 'antropología', 'antropólogo',
  'avion', 'arco', 'arquero', 'arremetida', 'agregar', 'ajedrez',
  'ajenjo', 'acelga', 'apio', 'aceituna', 'agua', 'albahaca',
  'alarma', 'asno', 'arepa', 'asma', 'alcachofa', 'avena', 'alegría',
  'amarillo', 'azul', 'ayer', 'asiento', 'animal', 'artimaña', 'abrir',
  // B
  'burro', 'bicicleta', 'banco', 'banca', 'barco', 'boletero', 'brillo', 'birillante',
  'barcaza', 'borrador', 'blanco', 'bahia', 'berenjena', 'banana', 'blasfemia', 'bebé',
  'bicho', 'borrego', 'bolso', 'berro', 'bulicio', 'bulla', 'buho', 'bohemia', 'botella',
  'botillerría', 'ballena', 'bestia', 'bonita', 'bella', 'bailarina', 'bruto',
  'brutalidad', 'belleza', 'bello', 'baile', 'boleta', 'billetera', 'bolso', 'bola',
  // C
  'casa', 'caballo', 'cristiano', 'castillo', 'carroza', 'cresta', 'cría', 'cactus', 'carruaje',
  'costa', 'cosa', 'camilla', 'católico', 'caca', 'comunicación', 'costo', 'costura', 'carabinero',
  'copa', 'copón', 'colegio', 'colega', 'contador', 'contaduría', 'corredor', 'correr', 'corregir',
  'callampa', 'camello', 'cajón', 'catastro', 'canción', 'castillo', 'callejón', 'contrato',
  'contratación', 'café', 'color', 'colorido', 'coliflor',
  // D
  'dedo', 'dedal', 'dado', 'dólar', 'doméstico', 'democracia', 'democrático', 'distribución',
  'dignidad', 'dolor', 'danza', 'debilidad', 'doctor', 'doctorado', 'discriminación',
  'dicción', 'detección', 'domesticación', 'de', 'destrucción', 'donar', 'donación', 'diversidad', 'dúo',
  'dos', 'daño', 'determinación', 'determinante', 'dogmático', 'diplomático', 'diplomacia',
  'derecho', 'delegado', 'delgado', 'durazno', 'damasco', 'droga', 'droggadicción', 'drama', 'dramático'
].map(word => word.replace(/s$]/g, "")).map(word => word.toLowerCase());
let respose;

// Fill the result id with a % of correct words
function fill_result(uniques) {
  correct = uniques.filter(word => WORDS.includes(word));
  incorrect = uniques.filter(word => !WORDS.includes(word));
  // fill the result id with a % of correct words
  result.innerText = `${correct.length}/40 (${(correct.length / 40) * 100}%)`;
  
  // Display all the words starting with the fist letter of the first recognized word,
  // and the words that are within the correct array should be blue and underlined
  all_words = WORDS.filter(word => word.startsWith(correct[0][0])).sort();
  list = all_words.map(word => {
    if (correct.includes(word)) {
      return `<li><span style="color: blue; text-decoration: underline;">${word}</span></li>`
    }
    return `<li>${word}</li>`;
  });
  recognized.innerHTML = `<ul>${list.join('')}</ul>`;
  // Display all the words that are not within the correct array in red
  errlist = incorrect.sort().map(word => `<li><span style="color: red;">${word}</span></li>`);
  incorrectEl.innerHTML = `Misrecognized: <ul>${errlist.join('')}</ul>`;
}

// Record audio and send it to the server
recordButton.addEventListener('click', () => {
  document.getElementById('result').innerText = '';
  //clear result, recognized and correct
  result.innerHTML = '';
  recognized.innerHTML = '';
  incorrectEl.innerHTML = ''; 

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
        let apiKey = localStorage.getItem('api_key') || apiKeyInput.value;
        formData.append('api_key', apiKeyInput.value);
        formData.append('audio', blob, 'recording.webm');
        fetch('https://api.camiguerra.cl', {
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            if (data.transcription) {
              localStorage.setItem('api_key', apiKey);
              response = data.transcription.split(' ')
                .map(word => word.toLowerCase())
                .map(word => word.replace(/s$]/g, ""));
              uniques = [...new Set(response)]
              fill_result(uniques)
            } else {
              result.innerText = 'Unknown Error';
            }

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

// Hide the api key input if the user already has an api key
window.addEventListener('load', function() {
  let api_key_localstorage = localStorage.getItem('api_key');
  if (api_key_localstorage) {
    document.getElementById('api-key').style.display = 'none';
  }
});