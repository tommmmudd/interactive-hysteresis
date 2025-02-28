
// Interactive Example 1: Two delays + filter (control delay time)
const example1 = new TwoDelays(audioContext, masterGain, 1)
examples.push(example1);

// Interactive Example 2: Two delays + filter (narrower range on delay time)
const example2 = new TwoDelaysConstrainedRange(audioContext, masterGain, 2)
examples.push(example2);

// Interactive Example 3: Two delays + filter (filter control)
const example3 = new TwoDelaysFilterControl(audioContext, masterGain, 3)
examples.push(example3);

// Interactive Example 4: Gutter osc variant
const example4 = new GutterOsc(audioContext, masterGain, 4)
examples.push(example4);





// =================================
// =================================
// STRUCTURE AND INITIALISATION
// called below when the button is pressed for the first time
const startAudio = async (context) => {

  console.log("startAudio()")

  // =================================
  // =================================
  // SETUP AUDIO
  console.log("Adding additional modules");

  // add processors
  await context.audioWorklet.addModule('two-delay-filter-processor.js');
  await context.audioWorklet.addModule('gutter-osc-processor.js');



  // SETUP VISUALISATIONS
  // ===============
  // visualition draw() function

  var currentCanvas = currentExample;
  visCanvas = document.getElementById('visualiser_'+(currentCanvas+1));
  canvasCtx = visCanvas.getContext("2d");

  canvasCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);
  
  function draw() {

    // have we changed example? If so, point to the corresponding canvas to draw to
    if (currentCanvas != currentExample)
    {
      console.log("switching canvas")

      // clear the current example canvas
      canvasCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);

      // switch to new canvas as target
      visCanvas = document.getElementById('visualiser_'+(currentExample+1));
      canvasCtx = visCanvas.getContext("2d");

      currentCanvas = currentExample;
    }

    drawVisual = requestAnimationFrame(draw);

    // =============
    // draw
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(239, 239, 239)';//  - this is #efefef?
    canvasCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);

    var barWidth = (visCanvas.width / bufferToUse) * 2.5;
    var barHeight;
    var x = 0;
    for(var i = 0; i < bufferToUse; i++) 
    {
      barHeight = dataArray[i]/2;
      barHeight = barHeight / 150.0;
      barHeight *= barHeight*barHeight;
      barHeight *= 75

      canvasCtx.fillStyle = 'rgb(50,'+(barHeight+50)+', 50)';
      canvasCtx.fillRect(x, visCanvas.height - barHeight/2, barWidth, barHeight);

      x += barWidth + 1;
    }
  };

  draw();


};



