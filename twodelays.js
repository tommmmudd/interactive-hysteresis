/** 
 * NOTE: doesn't use the base class, so manually implements the various functions...
 * 
 * 1x biquad filter
 * 2x delay  (#2 controlled)
 * compressor
 * noise/vca
 * 
 *    [noise] --v
 * [custom sample-rate fb] --> [out]
 * 
 * 
 * [custom sample-rate fb] is:
 * (fb) --> [gain] --> [[Filterbank]] --> [Delay] --> [tanh() + DC] --> (fb)
*/
class TwoDelays extends ExampleBase
{
  constructor(context, externalConnection, exampleIndex) 
  {
    super(context, externalConnection, exampleIndex);

    this.name = "Interactive example "+this.exampleIndex+": Two delays and a filter, with variable delay time.";
    this.description = "Feedback through two delay lines and a filter. The hyperbolic tangent function is used for soft clipping to constrain the feedback. The slider controls the delay time for one of the delay lines (smoothed over 250 samples)."
    this.sliderLabel = "Delay time (6 ms - 25 ms)"
  }

  loadModules()
  {

    this.processor = new AudioWorkletNode(this.context, 'two-delay-filter-processor')
    this.processor.connect(this.outputNode);
    this.param = this.processor.parameters.get("delayTime");

    this.processor.port.postMessage(['reset']); 

    this.isNotInitialised = false;
  }


  sliderInput(sliderVal, demoInstruction, valDisplay, rampTime=0)           
  {   

    super.sliderInput(sliderVal, demoInstruction, valDisplay, rampTime)

    var newDelayTime = Math.floor((sliderVal * sliderVal) * 838) + 265; // 6ms - 25 ms
    var delayTimeInMs = newDelayTime * 1000 / this.context.sampleRate 
    valDisplay.value = delayTimeInMs.toFixed(2) + " ms";    // ensure 2 decimal places max

    if (this.isNotInitialised)
    {
      console.log("start audio first with play button")
    }
    else
    {
      this.param.linearRampToValueAtTime(newDelayTime, this.context.currentTime + rampTime);
    }
  }
  

  on()
  {
    if (this.isNotInitialised)
    {
      this.loadModules();
    }

    this.outputNode.gain.linearRampToValueAtTime(1, this.context.currentTime + 0.05)

  }

  off()
  {
    clearInterval(this.interval);
    this.inDemoMode = false;
    this.outputNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.05)
  }


  // move smoothly from zero to 1
  playDemo(slider, demo_index, rate=0.001)    
  {    

    this.processor.port.postMessage(['reset']); 
    super.playDemo(slider, demo_index, rate=0.001)  
  }
}


class TwoDelaysConstrainedRange extends TwoDelays
{
  constructor(context, externalConnection, exampleIndex) 
  {
    super(context, externalConnection, exampleIndex);

    this.name = "Interactive example "+this.exampleIndex+": Narrower range of delay times";
    this.description = "The feedback loop is as shown in interactive example 1, but the input is constrained to a much narrow range of delay times."
    this.sliderLabel = "Delay time (8-10 ms)"
  }



  sliderInput(sliderVal, demoInstruction, valDisplay, rampTime=0)
  {

    var newDelayTime = Math.floor((sliderVal * sliderVal) * 88.2) + 352.8;
    var delayTimeInMs = newDelayTime * 1000 / this.context.sampleRate 
    valDisplay.value = delayTimeInMs.toFixed(2) + " ms";    // ensure 2 decimal places max

    // to be written in child class
    if (this.isNotInitialised)
    {
      console.log("start audio first with play button")
    }
    else
    {
      // the range here is 8-9 ms
      this.param.linearRampToValueAtTime(newDelayTime, this.context.currentTime + rampTime);

    }
  }

}



// TwoDelays
class TwoDelaysFilterControl extends TwoDelays
{
  constructor(context, externalConnection, exampleIndex) 
  {
    super(context, externalConnection, exampleIndex);

    this.name = "Interactive example "+this.exampleIndex+": filter cutoff control";
    this.description = "The feedback loop is the same as interactive examples 1 and 2, but the input now controls the filter cutoff frequency."
    this.sliderLabel = "Cutoff frequency (120-5000 Hz)"
  }


  loadModules()
  {
    super.loadModules();
    this.param = this.processor.parameters.get("cutoff");
  }


  sliderInput(sliderVal, demoInstruction, valDisplay, rampTime=0)
  {

    // this takes care of the demo: turning it off if demoInstruction is true
    super.sliderInput(sliderVal, demoInstruction, valDisplay, rampTime)

    var newFreq = ((sliderVal * sliderVal) * 4880.0) + 120.0; //(19080 * this.value * this.value) + 20;
    valDisplay.value = newFreq.toFixed(0) + " Hz"


    // to be written in child class
    if (this.isNotInitialised)
    {
      console.log("start audio first with play button")
    }
    else
    {
      // the range here is 8-9 ms

      this.param.linearRampToValueAtTime(newFreq, this.context.currentTime + rampTime);

    }
  }

}