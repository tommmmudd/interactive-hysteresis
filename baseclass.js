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
class ExampleBase
{
  constructor(context, externalConnection, exampleIndex) 
  {
    this.exampleIndex = exampleIndex
    this.name = "Interactive example "+this.exampleIndex
    this.description;
    this.sliderLabel;

    // context and canvas passed in
    this.context = context;

    // output node for linking with final masterGain node outside the class
    this.outputNode = context.createGain();
    this.outputNode.gain.value = 0;
    this.outputNode.connect(externalConnection);

    this.processor;
    this.param;
  
    // so that we run the loadModules() just once
    this.isNotInitialised = true;

    this.interval;  // for demo
    this.inDemoMode = false;
    
  }



  getName()         {    return this.name;  }
  getDescription()  {    return this.description;  }
  getSliderLabel()  {    return this.sliderLabel;  }

  loadModules() // override
  {  }


  sliderInput(sliderVal, demoInstruction, valDisplay, rampTime=0)           
  {   
    if (!demoInstruction && this.inDemoMode)
    {
      clearInterval(this.interval);
      this.inDemoMode = false;
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

    let valDisplay = document.getElementById((this.exampleIndex)+"-value");

    if (demo_index == 0)
    {
      if (! this.inDemoMode)
      {

        this.inDemoMode = true;

        // go from zero to one for example
        slider.value = 0;
        var finalValue = 1.0;
        var currentValue = 0;

        clearInterval(this.interval);


        this.interval = setInterval(()=>{
          
          currentValue += rate

          if (currentValue > finalValue)
          {
            slider.value = finalValue;
            this.sliderInput(finalValue, true, valDisplay);
            this.inDemoMode = false;
            clearInterval(this.interval);
          }

          slider.value = currentValue;
          this.sliderInput(currentValue, true, valDisplay);

        }, 1000/24);
      }
      else
      {
        // restart
        clearInterval(this.interval);
        this.inDemoMode = false;
        this.playDemo(slider, demo_index, rate)
      }
    }

    if (demo_index == 1)
    {

      if (! this.inDemoMode)
      {
        this.inDemoMode = true;

        var finalValue = Math.random();
        var currentValue = parseFloat(slider.value);
        

        var delta = (finalValue - currentValue) * 50 * rate; // (50 * rate) replaces 0.05

        this.interval = setInterval(()=>{
          
          currentValue += delta

          if (Math.abs(finalValue - currentValue) < Math.abs(delta*2))
          {
            finalValue = Math.random();
            delta = (finalValue - currentValue) * 0.1;
          }

          slider.value = currentValue;
          this.sliderInput(currentValue, true, valDisplay);

        }, 1000/24);
      }
      else
      {
        // restart
        clearInterval(this.interval);
        this.inDemoMode = false;
        this.playDemo(slider, demo_index)
      }
    }
  }


  playPattern(slider)
  {
    console.log("Playing pattern")

    if (! this.inDemoMode)
    {
      this.inDemoMode = true;
    }

    // reset if already running
    clearInterval(this.interval)

    // go from zero to one for example
    var count = 0;
    var countMax = 1;
    var seqIndex = 0;
    var seq = [0.1, 0.8, 0.2, 0.4];
    var dt = countMax * 1.0/24;

    let valDisplay = document.getElementById((this.exampleIndex)+"-value");


    this.interval = setInterval(()=>{

      count += 1;
      if (count >= countMax)
      {
        count = 0;
        countMax *= 1.075;
        dt = countMax * 1.0/24;
        if (countMax > 200)
          countMax = 200;
        seqIndex += 1;
        seqIndex %= seq.length;
        var newVal = seq[seqIndex]

        var sliderVal = newVal;//this.getSliderValFromPattern  (newVal)
        slider.value = sliderVal;
        this.sliderInput(sliderVal, true, valDisplay, dt*0.333);
      }
      
    }, 1000/24);
  }
    
}
