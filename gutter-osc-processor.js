/**
 * JS Variation of the Gutter Oscillator. Requires Biquad and Delay classes 
 * https://github.com/tommmmudd/guttersynthesis/
 *
 * @class GutterOsc
 * @extends AudioWorkletProcessor
 */
class GutterOsc extends AudioWorkletProcessor {


  static get parameterDescriptors() {
    return [
      { name: 'damping', defaultValue: 0.25, minValue: 0.00001, maxValue: 1.0},
      { name: 'resonance', defaultValue: 10, minValue: 0.1, maxValue: 1000},
      { name: 'delayTime', defaultValue: 50, minValue: 1, maxValue: 500},
      ];
  }

  constructor(options) {
    super();
    //console.log("GutterOsc constructor called");

    this.filterCount = 24;

    // frequencies generated with Math.random() * 2000 + 45;
    // but then fixed here for consistency rather than being re-randomised every time
    let freqs = [636.1915096485743, 1132.207845381619, 199.8902572489008, 48.375910760986756, 201.684405824695, 1676.8652075728507, 526.7051824871924, 2014.0189522255102, 1765.4778470065348, 1934.266686409024, 490.25148448140993, 294.7191045979821, 2027.1595798703083, 959.4932248736973, 1518.6085423721006, 484.4466743634133, 296.3043028666657, 1858.7287946782874, 172.82474641456253, 1670.811137659699, 262.82370997195596, 498.05989871317774, 1862.201802996248, 463.2789073585864];
    this.filters = [];
    for (let i=0; i<this.filterCount; i++)
    {
      this.filters[i] = new Biquad(); 
      this.filters[i].setFreq(freqs[i]);
      this.filters[i].setQ(10);
      this.filters[i].calcCoeffs();
    }

    this.delay = new Delay();
    this.delay.setDelayTimeInSamples(50);

    this.Q = 10;

    this.feedbackVal = 0;
    this.feedbackGain = 40.0;

    this.duffX = 1;
    this.duffY = 0;
    this.gain = 0.4;

  }


  process(inputs, outputs, parameters) {

    const inputData = inputs[0][0];

    var output = outputs[0];
    
    let qParam = parameters.resonance;
    let tempQ = this.Q;

    if (tempQ.length === 1) 
    {
      tempQ = parseFloat(qParam);
    }
    else 
    {
      tempQ = qParam[0];
    }

    if (tempQ != this.Q)
    {
      this.Q = tempQ
      this.setQ(this.Q)
    }

    
    for (let channel = 0; channel < output.length; ++channel) 
    {
      
      const outputChannel = output[channel];
      var outputVal = 0.0;

      for (let i = 0; i < outputChannel.length; i++) {

        if (channel == 0) {

          let filtered = 0.0; // no input

          // sum output of filter bank
          for (let j=0; j<this.filterCount; j++)
          {
            filtered += this.filters[j].process(this.duffX);
          }

          filtered *= this.gain;

          let prevY = this.duffY
          this.duffY = 0.95*this.duffY + filtered - (filtered*filtered*filtered)
          this.duffX = Math.atan(prevY); // also: Math.tanh()

          // failsafe (not being used)
          if (isNaN(this.duffX)) { this.resetDuff(); console.log("resetting Duff") }

          outputVal = filtered * 0.25;
        }
        
        outputChannel[i] = outputVal;
      }
    }

    return true;
  }

  resetDuff() { this.duffX = 1; this.duffY = 0; this.t = 0; }


  setQ(newQ)
  {
    for (let j=0; j<this.filterCount; j++)
    {
      this.filters[j].setQ(newQ);
      this.filters[j].calcCoeffs();
    }
  }


  
}

registerProcessor("gutter-osc-processor", GutterOsc);
console.log("Adding module gutter-osc-processor (GutterOsc)");





// Basic Biquad used as bandpass only
class Biquad
{
  constructor()
  {
    this.a0, this.b2, this.b1, this.b2;
    this.filterFreq = 100;
    this.Q = 3;
    this.V = Math.pow(10, 1.0 / 20); // 1.0 was gain, now fixed
    this.sampleRate = 44100;

    this.targetFreq = this.filterFreq;
    this.transitionTimeInSamples = 1500;
    this.transitionFreq = this.filterFreq;
    this.transitionCounter = this.transitionTimeInSamples; 


    this.prevX2 = 0; this.prevX1 = 0; this.prevY1 = 0; this.prevY2 = 0;
  }

  setFreq(newFreq)  { this.targetFreq = newFreq; this.transitionFreq = this.filterFreq; this.transitionCounter = 0; }
  setQ(_q) { this.Q = _q; }

  calcCoeffs()
  {
    let K = Math.tan(3.141592653589793 * this.filterFreq / this.sampleRate);
    let norm = 1 / (1 + K / this.Q + K * K);
    this.a0 = K / this.Q * norm;
    this.a2 = -this.a0;
    this.b1 = 2 * (K * K - 1) * norm;
    this.b2 = (1 - K / this.Q + K * K) * norm;
  }
  
  process(inVal)
  {

    // smmoth transitions in cutoff
    if (this.transitionCounter < this.transitionTimeInSamples)
    {
      this.filterFreq += (this.targetFreq - this.transitionFreq) / this.transitionTimeInSamples;
      this.transitionCounter += 1;
      this.calcCoeffs();
    }

    let y = this.a0*inVal  +  this.a2*this.prevX2  -  this.b1*this.prevY1  -  this.b2*this.prevY2;
    this.prevX2 = this.prevX1;
    this.prevX1 = inVal;
    this.prevY2 = this.prevY1;
    this.prevY1 = y;
    return y;  
  }
}


// Simple delay line - currently fixed max duration at 1000 samples..
class Delay
{
  constructor()
  {
    this.buffer = [];
    this.size = 1000;
    this.readPos = 0;
    this.writePos = 0;

    for (let i=0; i<this.size; i++)
    {
      this.buffer[i] = 0.0;
    }

  }

  readVal()
  {
      // get current value at readPos
      let outVal = this.linearInterpolation(); //this.buffer[this.readPos];
      // increment readPos
      this.readPos ++;
      
      if (this.readPos >= this.size)
          this.readPos = 0;
   
      return outVal;
  }

  linearInterpolation()
  {
      // get buffer index
      let indexA = Math.floor(this.readPos);
      let indexB = indexA + 1;
      
      // wrap
      if (indexB >= this.size)
          indexB -= this.size;
      
      let valA = this.buffer[indexA];
      let valB = this.buffer[indexB];
      
      let remainder = this.readPos - indexA;
      
      let interpolatedValue = (1-remainder)*valA  +  remainder*valB;
      
      return interpolatedValue;
      
  }

  writeVal(inputSample)
  {
      // store current value at writePos
      this.buffer[this.writePos] = inputSample;
      
      // increment writePos
      this.writePos ++;
      
      if (this.writePos >= this.size)
          this.writePos = 0;
  }

  process(inputSample)
  {
    let outVal = this.readVal(inputSample);
    this.writeVal(inputSample);
    return outVal;
  }

  setDelayTimeInSamples(delayTimeInSamples)
  {
    if (delayTimeInSamples > this.size)
        delayTimeInSamples = this.size;
    
    if (delayTimeInSamples < 1)
        delayTimeInSamples = 1;
    
    this.readPos = this.writePos - delayTimeInSamples;
    
    // if readPos < 0, then add size to readPos
    if (this.readPos < 0)
        this.readPos += this.size;
  }
}