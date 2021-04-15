// This object represent the waveform generator
var WaveformGenerator = {
    // The generateWaveform function takes 4 parameters:
    //     - type, the type of waveform to be generated
    //     - frequency, the frequency of the waveform to be generated
    //     - amp, the maximum amplitude of the waveform to be generated
    //     - duration, the length (in seconds) of the waveform to be generated
    generateWaveform: function(type, frequency, amp, duration) {
        var nyquistFrequency = sampleRate / 2; // Nyquist frequency
        var totalSamples = Math.floor(sampleRate * duration); // Number of samples to generate
        var result = []; // The temporary array for storing the generated samples

        switch(type) {
            case "sine-time": // Sine wave, time domain
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    result.push(amp * Math.sin(2.0 * Math.PI * frequency * currentTime));
                }
                break;

            case "square-time": // Square wave, time domain

                var oneCycle = sampleRate / frequency;
                var halfCycle = oneCycle / 2;
                for (var i = 0; i < totalSamples; ++i) {
                    var whereInTheCycle = i % parseInt(oneCycle);
                    if (whereInTheCycle < halfCycle)
                // first half of the cycle
                        result.push(1.0*amp); // Assume the highest value is 1
                    else
                // second half of the cycle
                        result.push(-1.0*amp); // Assume the lowest value is -1
                 }
                break;

            case "square-additive": // Square wave, additive synthesis

                for (var i=0; i< totalSamples; ++i){
                    var t = i/sampleRate;
                    var sample = 0;
                    var k = 1;
                    while(k*frequency <= nyquistFrequency){
                        sample += (1.0/k)*Math.sin(2*Math.PI*k*frequency*t);
                        k+=2;
                    }
                    result.push(sample*amp);
                }
                break;

            case "sawtooth-time": // Sawtooth wave, time domain

                var oneCycle = sampleRate / frequency;
                for (var i = 0; i < totalSamples; ++i) {
                    var whereInTheCycle = i % parseInt(oneCycle);
                    var fractionInTheCycle =
                    whereInTheCycle / oneCycle;
                    result.push(2 * amp * (1.0 - fractionInTheCycle) - amp);
                }

                break;

            case "sawtooth-additive": // Sawtooth wave, additive synthesis

                for (var i=0; i< totalSamples; ++i){
                    var t = i/sampleRate;
                    var sample = 0;
                    var k = 1;
                    while(k*frequency <= nyquistFrequency){
                        sample += (1.0/k)*Math.sin(2*Math.PI*k*frequency*t);
                        k+=1
                    }
                    result.push(sample*amp);
                }
                break;

            case "triangle-additive": // Triangle wave, additive synthesis

                for (var i=0; i< totalSamples; ++i){
                    var t = i/sampleRate;
                    var sample = 0;
                    var k = 1;
                    while(k*frequency <= nyquistFrequency){
                        sample += (1.0/(k*k))*Math.cos(2*Math.PI*k*frequency*t);
                        k+=2;
                    }
                    result.push(sample*amp);
                }
                break;

            case "karplus-strong": // Karplus-Strong algorithm


                // Obtain all the required parameters
                var base = $("#karplus-base>option:selected").val();
                var b = parseFloat($("#karplus-b").val());
                var delay = parseInt($("#karplus-p").val());
                var useFreq = $("#karplus-use-freq").prop("checked");
                var impulse = [];

                if(useFreq){
                    delay = sampleRate/frequency;
                }

                for (var i = 0; i < totalSamples; ++    i) {
                    if (i <= delay){
                        switch(base){
                            case "white-noise":
                                impulse[i]=Math.random()*2*amp - amp;
                                result.push(impulse[i]);
                                break;

                            case "sawtooth":
                                var fractionInTheCycle =
                                i /delay;
                                impulse[i]= 2 * amp * (1.0 - fractionInTheCycle) - amp;
                                result.push(impulse[i]);
                        }}

                    else if (i>delay){
                        if(Math.random()<b){
                            impulse[i] = 0.5*(impulse[i-delay]+impulse[i - delay - 1]);
                            result.push(impulse[i]);
                        }

                        else{
                            impulse[i] = -0.5*(impulse[i-delay]+impulse[i- delay - 1]);
                            result.push(impulse[i]);
                        }
                    }
                }

                break;

            case "white-noise": // White noise

                for (var i = 0; i<totalSamples; ++i){
                    result.push(Math.random()*2*amp - amp);
                }
                break;

            case "customized-additive-synthesis": // Customized additive synthesis


                // Obtain all the required parameters
				var harmonics = [];
				for (var h = 1; h <= 10; ++h) {
					harmonics.push($("#additive-f" + h).val());
				}

                for (var i=0; i< totalSamples; ++i){
                    var t = i/sampleRate;
                    var sample = 0;
                    for (var k = 1; k<= 10; ++k){
                        if(k*frequency <= nyquistFrequency){
                        sample += harmonics[k-1]*(Math.sin(2*Math.PI*k*frequency*t));
                        }
                        else{console.log("frequency too high!");}
                    }
                    result.push(sample*amp);
                }
                break;

            case "fm": // FM


                // Obtain all the required parameters
                var carrierFrequency = parseFloat($("#fm-carrier-frequency").val());
                var carrierAmplitude = parseFloat($("#fm-carrier-amplitude").val());
                var modulationFrequency = parseFloat($("#fm-modulation-frequency").val());
                var modulationAmplitude = parseFloat($("#fm-modulation-amplitude").val());
                var useADSR = $("#fm-use-adsr").prop("checked");
                var useFreq = $("#fm-use-freq-multiplier").prop("checked");
                if (useFreq){
                    modulationFrequency = modulationFrequency*frequency;
                    carrierFrequency = carrierFrequency*frequency;
                }


                if(useADSR) { // Obtain the ADSR parameters
                    var attackDuration = parseFloat($("#fm-adsr-attack-duration").val()) * sampleRate;
                    var decayDuration = parseFloat($("#fm-adsr-decay-duration").val()) * sampleRate;
                    var releaseDuration = parseFloat($("#fm-adsr-release-duration").val()) * sampleRate;
                    var sustainLevel = parseFloat($("#fm-adsr-sustain-level").val()) / 100.0;

                    for(var i = 0; i < totalSamples; ++i) {
                        
                        var currentTime = i/sampleRate;

                        if(i <= attackDuration){
                            modulator = lerp(0,1,i/attackDuration)*(modulationAmplitude * Math.sin(2.0 * Math.PI * modulationFrequency * currentTime));
                            sample = carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator);
                        }
                        else if (i > attackDuration &&
                            i <= attackDuration + decayDuration){
                            modulator = lerp(1,sustainLevel,(i-attackDuration)/decayDuration)*(modulationAmplitude * Math.sin(2.0 * Math.PI * modulationFrequency * currentTime));
                            sample = carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator);
                            }
                        else if (i > attackDuration + decayDuration &&
                            i <= totalSamples - releaseDuration){
                            modulator = sustainLevel*(modulationAmplitude * Math.sin(2.0 * Math.PI * modulationFrequency * currentTime));
                            sample = carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator);
                            }
                        else if (i > totalSamples - releaseDuration &&
                            i < totalSamples){
                            modulator = lerp(sustainLevel,0,(i-(totalSamples - releaseDuration))/releaseDuration)*(modulationAmplitude * Math.sin(2.0 * Math.PI * modulationFrequency * currentTime));
                            sample = carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator);
                            }

                        result.push(sample*amp);
                    }
                }
                else{
                    for (var i = 0; i < totalSamples; ++i) {
                        var currentTime = i/sampleRate;
                        var modulator = modulationAmplitude * Math.sin(2.0 * Math.PI * modulationFrequency * currentTime);
                        var sample = carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator);
                        result.push(sample*amp);
                    }
                }
                break;

            case "repeating-narrow-pulse": // Repeating narrow pulse
                var cycle = Math.floor(sampleRate / frequency);
                for (var i = 0; i < totalSamples; ++i) {
                    if(i % cycle === 0) {
                        result.push(amp * 1.0);
                    } else if(i % cycle === 1) {
                        result.push(amp * -1.0);
                    } else {
                        result.push(0.0);
                    }
                }
                break;

            default:
                break;
        }

        return result;
    }
};
