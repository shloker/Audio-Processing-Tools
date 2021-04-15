// This object represent the postprocessor
Postprocessor = {
    // The postprocess function takes the audio samples data and the post-processing effect name
    // and the post-processing stage as function parameters. It gathers the required post-processing
    // paramters from the <input> elements, and then applies the post-processing effect to the
    // audio samples data of every channels.
    postprocess: function(channels, effect, pass) {
        switch(effect) {
            case "no-pp":

                break;

            case "reverse":

                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    // Apply the post-processing, i.e. reverse
                    audioSequence.data = audioSequence.data.reverse();
                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "boost":
                // Find the maximum gain of all channels
                var maxGain = -1.0;
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    var gain = audioSequence.getGain();
                    if(gain > maxGain) {
                        maxGain = gain;
                    }
                }

                // Determin the boost multiplier
                var multiplier = 1.0 / maxGain;

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // For every sample, apply a boost multiplier
                    for(var i = 0; i < audioSequence.data.length; ++i) {
                        audioSequence.data[i] *= multiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "adsr":


                // Obtain all the required parameters
                var attackDuration = parseFloat($("#adsr-attack-duration").data("p" + pass)) * sampleRate;
                var decayDuration = parseFloat($("#adsr-decay-duration").data("p" + pass)) * sampleRate;
                var releaseDuration = parseFloat($("#adsr-release-duration").data("p" + pass)) * sampleRate;
                var sustainLevel = parseFloat($("#adsr-sustain-level").data("p" + pass)) / 100.0;

                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    for(var i = 0; i < audioSequence.data.length; ++i) {

                        // TODO: Complete the ADSR postprocessor
                        // Hinst: You can use the function lerp() in utility.js
                        // for performing linear interpolation
                        if(i <= attackDuration){
                            audioSequence.data[i] *= lerp(0,1,i/attackDuration);
                        }
                        else if (i > attackDuration &&
                            i <= attackDuration + decayDuration){
                            audioSequence.data[i] *= lerp(1,sustainLevel,(i-attackDuration)/decayDuration);
                            }
                        else if (i > attackDuration + decayDuration &&
                            i <= audioSequence.data.length - releaseDuration){
                            audioSequence.data[i] *= sustainLevel;
                            }
                        else if (i > audioSequence.data.length - releaseDuration &&
                            i < audioSequence.data.length){
                            audioSequence.data[i] *= lerp(sustainLevel,0,(i-(audioSequence.data.length - releaseDuration))/releaseDuration);
                            }

                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "tremolo":


                // Obtain all the required parameters
                var tremoloFrequency = parseFloat($("#tremolo-frequency").data("p" + pass));
                var wetness = parseFloat($("#tremolo-wetness").data("p" + pass));

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    // For every sample, apply a tremolo multiplier

                    for(var i = 0; i < audioSequence.data.length; ++i) {
                         var currentTime = i/sampleRate;
                         var multiplier = (Math.sin(2.0 * Math.PI * tremoloFrequency * currentTime - 0.5*Math.PI)+1)/2;
                         multiplier = multiplier*wetness +(1-wetness);
                         audioSequence.data[i] *= multiplier;
                    // Update the sample data with the post-processed data
                }
                channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "echo":
              

                // Obtain all the required parameters
                var delayLineDuration = parseFloat($("#echo-delay-line-duration").data("p" + pass));
                var multiplier = parseFloat($("#echo-multiplier").data("p" + pass));
                var delayLineSize = delayLineDuration*sampleRate;

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    // Create a new empty delay line
                    var delayLine = [];
                    for (var i=0 ; i < delayLineSize; ++i){delayLine.push(0);}
                    var delayLineOutut;
                    // Get the sample data of the channel
                    for(var i = 0; i < audioSequence.data.length; ++i) {
                        // Get the echoed sample from the delay line
                            delayLineOutut = delayLine[i%delayLineSize];
                        // Add the echoed sample to the current sample, with a multiplier
                            audioSequence.data[i] = audioSequence.data[i] + (multiplier*delayLineOutut);
                        // Put the current sample into the delay line
                        delayLine[i%delayLineSize] = audioSequence.data[i];
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            default:
                // Do nothing
                break;
        }
        return;
    }
}
