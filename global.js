// load audio context
const audioContext = new AudioContext();

// which one are we currently hearing?
let currentExample = 0;

// Have we turned on audio yet?
let notYetOn = true;

// How many examples in total?
let exampleCount = 4;

// array of interactive examples (populated in start_audio.js)
let examples = [];


// All nodes output here:
const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);


// set up analyser for spectrogram visualisations
var visCanvas;
var analyser = audioContext.createAnalyser();
masterGain.connect(analyser);
analyser.fftSize = 4096;
var bufferLength = analyser.frequencyBinCount;
var bufferToUse = bufferLength/6
var dataArray = new Uint8Array(bufferToUse);