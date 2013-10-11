// Buffers of values collected by Leap Motion. We'll use them
// to plot graphics with flot JQuery plugin.
var palmBuffer = []; // Z component palm's normal
var thumbBuffer = []; // X component palm's normal

// This is the buffer general size: How many registers we'll buffer.
var bufferSize = 30;

// When we push some values to our buffer is super useful to create an index
// to it. Also very useful ploting data to graphic
var palmIndex = 0;
var thumbIndex = 0;

// Preventing noises on our slop analysis, we set a delta value wich is the
// delta on our derivative calculus. 
var delta = 10;

// This is a global instance for our flot graphic
var flot;

// The following functions transform our buffers in a flot compatible collection 
// of values ready to create our graphics.
function getPalmBuffer() {
    var res = [];
    if(palmBuffer.length >= bufferSize) {
        for(var i = 0; i < bufferSize; i++) {
            res[i] = [i, palmBuffer[i][1]];
        }
    }
    return res;
}
function getThumbBuffer() {
    var res = [];
    if(thumbBuffer.length >= bufferSize) {
        for(var i = 0; i < bufferSize; i++) {
            res[i] = [i, thumbBuffer[i][1]];
        }
    }
    return res;
}

// The following functions push values to buffer tail and cut of its head. Yeah!
// What a baddass functions! ;)
function addPalmBuffer(palmNormal) {
    if(palmBuffer.length > bufferSize) {
        palmBuffer = palmBuffer.slice(palmBuffer.length-bufferSize, palmBuffer.length);
    }
    palmBuffer.push([palmIndex, palmNormal]);
    palmIndex++;
}
function addThumbBuffer(thumbAngle) {
    if(thumbBuffer.length > bufferSize) {
        thumbBuffer = thumbBuffer.slice(thumbBuffer.length-bufferSize, thumbBuffer.length);
    }
    thumbBuffer.push([thumbIndex, thumbAngle]);
    thumbIndex++;
}

// These functions below are our nerdy fellows. They make the "math thing" 
// evaluating the buffer last values curve slope.
function palmBufferAnalysis() {
    var slope = 100*(palmBuffer[bufferSize][1]-palmBuffer[bufferSize-delta][1])/delta;
    return slope;
}
function thumbBufferAnalysis() {
    var slope = 100*(thumbBuffer[bufferSize][1]-thumbBuffer[bufferSize-delta][1])/delta;
    return slope;
}

// We call this functions here every frame asking if the slopes we analysing 
// satisfies a condition and if it does, execute a callback.
function fingerHit(triggerSlope, callback) {
    if(palmBufferAnalysis() > triggerSlope) {
        callback();
    }
}
function heelHit(triggerSlope, callback) {
    if(palmBufferAnalysis() < triggerSlope) {
        callback();
    }
}
function thumbHit(triggerSlope, callback) {
    if(thumbBufferAnalysis() > triggerSlope) {
        callback();
    }
}

// "Hey mr dj put a record on" function
function playBeat (id) {
    var tmpAudio = document.getElementById(id);
    tmpAudio.volume = 1;
    if(tmpAudio.paused)
        tmpAudio.play();
}

$(document).ready(function() {
    // Create an instance of our realtime graphic
    flot = $.plot(
        // We are creating here an instance of flot on a div with id #output
        '#output', 
        // We also plot 2 curves: Z and X components of palm's normal. If we 
        // want to see more curves, just add a new well formated element in this
        // array and watch the magic
        [getPalmBuffer(), getThumbBuffer()],
        {
        // Drawing is faster without shadows
        series: {
                    shadowSize: 0   
        },
        // Graph scale
        yaxis: {
            min: -2,
            max: 2
        },
        xaxis: {
            min: 0,
            max: bufferSize
        }
    });
    // Refresh our buffers every 100 milliseconds
    var interval = setInterval(function() {
        flot.setData([getPalmBuffer(), getThumbBuffer()]);
        flot.draw();
    }, 100);

    // Leap loop it is
    Leap.loop(function(frame) {
        // If we have hands on stage
        if(frame.hands.length) {
            // So far we only consider one hand
            var hand = frame.hands[0];
            // Add values to our buffers
            addPalmBuffer(hand.palmNormal[2]);
            addThumbBuffer(hand.palmNormal[0]);
            // Check if slope satisfies a condition and execute a callback
            fingerHit(4, function() {
                playBeat('Finger_drum_A');
            });
            heelHit(-2, function() {
                playBeat('Heel_drum_A');
            })
            thumbHit(2, function() {
                playBeat('Thumb_drum_A');
            })
        }
    });

});
