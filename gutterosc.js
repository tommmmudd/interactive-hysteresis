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
class GutterOsc extends ExampleBase
{
  constructor(context, externalConnection, exampleIndex) 
  {
    super(context, externalConnection, exampleIndex);

    this.name = "Interactive example "+this.exampleIndex+": \"Gutter\" Oscillator";
    this.description = "A non-forced version of an oscillator from the Gutter Synth (Mudd 2019) using damping and a cubic nonlinearity in a feedback loop with a set of 24 bandpass filters:"
    this.sliderLabel = "Filter resonance (0.1 - 200)"

    this.tempQ = 10;
    
  }


  loadModules()
  {

    this.processor = new AudioWorkletNode(this.context, 'gutter-osc-processor')
    this.processor.connect(this.outputNode);
    this.param = this.processor.parameters.get("resonance");

    this.isNotInitialised = false;
  }


  sliderInput(sliderVal, demoInstruction, valDisplay, rampTime=0)           
  {   
    // var newDelayTime2 = Math.floor((sliderVal * sliderVal) * 200) + 200;
    var newQ = (sliderVal * sliderVal * 200.0)
    if (newQ < 0.1) {newQ = 0.1;}
    valDisplay.value = newQ.toFixed(1);

    if (!demoInstruction && this.inDemoMode)
    {
      clearInterval(this.interval);
      this.inDemoMode = false;
    }

    if (this.isNotInitialised)
    {
      console.log("start audio first with play button")
    }
    else
    {

      // NOTE: check whether 
      if (this.tempQ != newQ)
      {
        // check something has changed so we're not always messing with the filters...
        this.param.setValueAtTime(newQ, this.context.currentTime);
        this.tempQ = newQ
      }
      
    }
  }
    
}
