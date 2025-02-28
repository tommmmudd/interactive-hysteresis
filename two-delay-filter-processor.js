/**
 * MONO! Moog filter based on Noise Hack implementation: https://noisehack.com/custom-audio-effects-javascript-web-audio-api/
 * 
 * from musicdsp example: 
 * http://www.musicdsp.org/showArchiveComment.php?ArchiveID=26
 *
 * @class MoogFilterProcessor
 * @extends AudioWorkletProcessor
 */
class TwoDelayFilterProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    return [
        { name: 'delayTime', defaultValue: 150, minValue: 200, maxValue: 1200},
        { name: 'cutoff', defaultValue: 600, minValue: 10, maxValue: 20000}
      ];
  }

  //var newDelayTime2 = Math.floor((x * x) * 200) + 200;

  constructor(options) {
    super();

    let gain = 1;

    this.filter = new Biquad()
    this.filter.setFreq(600);
    this.filter.setQ(0.5);
    this.filter.calcCoeffs();

    this.delay = new Delay();
    this.delay.setDelayTimeInSamples(250);

    this.delay2 = new Delay();
    this.delay2.setDelayTimeInSamples(150);

    this.feedbackVal = 0.1;
    this.feedbackGain = 5.0;

    this.feedbackVal2 = 0;
    this.feedbackGain2 = 5.0;

    // local version of param values (only updating if slider changed)
    this.delayTime = 300;
    this.cutoff = 1400;

    this.shouldReset = false;


    // OLD

    this.targetFreq = this.cutoff;
    this.transitionTimeInSamples = 1500;
    this.transitionFreq = this.cutoff;
    this.transitionCounter = this.transitionTimeInSamples;

    this.port.onmessage = (e) => {
      if (e.data[0] =="reset")
      {
        this.shouldReset = true;
      }
    }

  }

  reset()
  {
    console.log("resetting twodelay DSP")
    this.feedbackVal = 0.1;
    this.feedbackVal2 = 0;
    this.delay.reset();
    this.delay2.reset();
    this.filter.reset();

  }

  process(inputs, outputs, parameters) {

    var input = inputs[0][0];

    const outputL = outputs[0][0];
    var outputR = null
    if (outputs[0].length > 1) {
      outputR = outputs[0][1]
    }

    
    // =====================
    // update parameters

    // (1) DELAY TIME

    let delay2Param = parameters.delayTime;        // from parameter list declared above
    let tempDelayTime = this.delayTime;

    // single unsmoothed input (not a vector)
    if (delay2Param.length === 1) {
      tempDelayTime = parseFloat(delay2Param);
    }

    if (tempDelayTime != this.delayTime)
    {
      // update delay if it has changed (and only if)
      this.delayTime = tempDelayTime;
      // console.log("updating delay time "+this.delayTime)
      this.delay2.setDelayTimeInSamplesSmooth(this.delayTime);
    }

    // (2) FILTER CUTOFF

    let cutoffParam = parameters.cutoff;        // from parameter list declared above
    let tempCutoff = this.cutoff;

    // single unsmoothed input (not an array)
    if (cutoffParam.length === 1) {
      tempCutoff = parseFloat(cutoffParam);
    }

    if (tempCutoff != this.cutoff)
    {
      this.cutoff = tempCutoff;
      this.filter.setFreq(this.cutoff);
    }

    var f = (2 * this.cutoff / sampleRate) * 1.16;
    var fb = this.resonance * (1.0 - 0.15 * f * f);

    for (var i = 0; i < outputL.length; i++) 
    {

      // do we have an array of parameter changes (e.g. smoothed)?
      if (delay2Param.length !== 1) {
        tempDelayTime = delay2Param[i]
        this.delayTime = tempDelayTime
        this.delay2.setDelayTimeInSamplesSmooth(this.delayTime);
      }
      if (cutoffParam.length !== 1) {
        tempCutoff = cutoffParam[i]
        this.cutoff = tempCutoff
        this.filter.setFreq(this.cutoff);
      }

      if (this.shouldReset)
      {
        this.reset();
        this.shouldReset = false;
      }

      let nextInput = 0.25 * Math.atan(/*input[i] + */this.feedbackVal*this.feedbackGain + this.feedbackVal2*this.feedbackGain2);

      let filtered = this.filter.process(nextInput);
      let delayed = this.delay.process(filtered);
      let delayed2 = this.delay2.process(delayed);

      delayed = Math.atan(delayed);
      if (isNaN(delayed)) { delayed = 0; }
      this.feedbackVal = delayed;

      delayed2 = Math.atan(delayed2);
      if (isNaN(delayed2)) { delayed2 = 0; }
      this.feedbackVal2 = delayed2;

      let outputSample = filtered * 1.0;

      outputL[i] = outputSample;
      if (outputR != null)
      {
        outputR[i] = outputSample;
      }
    }
    return true;
  }

}


registerProcessor("two-delay-filter-processor", TwoDelayFilterProcessor);
console.log("Adding two-delay-filter-processor (TwoDelayFilterProcessor)");





// Basic Biquad stuck in bandpass mode
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

  reset()
  {
    this.prevX2 = 0; this.prevX1 = 0; this.prevY1 = 0; this.prevY2 = 0;
  }

  setFreq(newFreq)  { this.targetFreq = newFreq; this.transitionFreq = this.filterFreq; this.transitionCounter = 0; }
  //setFreq(freq) { this.filterFreq = freq; }
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





// SIMPLE DELAY CLASS - currently fixed max duration at 1000 samples..
class Delay
{
  constructor()
  {
    this.buffer = [];
    this.size = 5000;
    this.readPos = 0;
    this.writePos = 0;

    this.delayTimeInSamples = this.size;

    // for smoothing
    
    this.targetDelayTime = this.delayTimeInSamples;
    this.transitionTimeInSamples = 1500;
    this.transitionDelayTime = this.delayTimeInSamples;
    this.transitionCounter = this.transitionTimeInSamples; 


    for (let i=0; i<this.size; i++)
    {
      this.buffer[i] = 0.0;
    }

  }

  reset()
  {
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

    if (this.transitionCounter < this.transitionTimeInSamples)
    {
      let newDelayTime = this.delayTimeInSamples + ((this.targetDelayTime - this.transitionDelayTime) / this.transitionTimeInSamples);
      this.setDelayTimeInSamples(newDelayTime)
      this.transitionCounter += 1;
    }

    let outVal = this.readVal(inputSample);
    this.writeVal(inputSample);
    return outVal;
  }

  setDelayTimeInSamples(newDelayTimeInSamples)
  {
    if (newDelayTimeInSamples > this.size)
        newDelayTimeInSamples = this.size;
    
    if (newDelayTimeInSamples < 1)
        newDelayTimeInSamples = 1;

    this.delayTimeInSamples = newDelayTimeInSamples;
    
    this.readPos = this.writePos - this.delayTimeInSamples;
    
    // if readPos < 0, then add size to readPos
    if (this.readPos < 0)
        this.readPos += this.size;
  }

  setDelayTimeInSamplesSmooth(newTime)  { this.targetDelayTime = newTime; this.transitionDelayTime = this.delayTimeInSamples; this.transitionCounter = 0; }
}


