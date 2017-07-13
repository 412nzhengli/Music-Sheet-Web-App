window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = null;
var mediaStreamSource = null;
var isPlatying = true;
var recordB = false;
var detectorElem,
	canvasElem,
	waveCanvas,
	pitchElem,
	noteElem,
	detuneElem,
	detuneAmount;

window.onload = function() {
	audioContext = new AudioContext();
    // Corresponds to a 5kHz signal
	MAX_SIZE = Math.max(4, Math.floor(audioContext.sampleRate / 5000));

	detectorElem = document.getElementById("detector");
	canvasElem = document.getElementById("output");
	DEBUGCANVAS = document.getElementById("waveform");

	if (DEBUGCANVAS) {
		waveCanvas = DEBUGCANVAS.getContext("2d");
		waveCanvas.strokeStyle = "black";
		waveCanvas.lineWidth = 1;
	}
	pitchElem = document.getElementById("pitch");
	noteElem = document.getElementById("note");
	detuneElem = document.getElementById("detune");
	detuneAmount = document.getElementById("detune_amt");

	detectorElem.ondragenter = function() {
		this.classList.add("droptarget");
		return false;
    };
	detectorElem.ondragleave = function() {
        this.classList.remove("droptarget");
        return false;
    };
	detectorElem.ondrop = function(e) {
  		this.classList.remove("droptarget");
  		e.preventDefault();
		theBuffer = null;

	  	var reader = new FileReader();
	  	reader.onload = function (event) {
	  		audioContext.decodeAudioData(event.target.result, function(buffer) {
	    		theBuffer = buffer;
	  		}, function() {
                alert("error loading!");
            });
	  	};
	  	reader.onerror = function (event) {
	  		alert("Error: " + reader.error );
		};
	  	reader.readAsArrayBuffer(e.dataTransfer.files[0]);
	  	return false;
	};


    // Drag and drop
    var isAdvancedUpload = function() {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();

    var $form = $('.box');
    if (isAdvancedUpload) {
      $form.addClass('has-advanced-upload');
    }

    if (isAdvancedUpload) {
        var droppedFiles = false;
        $form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }).on('dragover dragenter', function() {
            $form.addClass('is-dragover');
        }).on('dragleave dragend drop', function() {
            $form.removeClass('is-dragover');
        }).on('drop', function(e) {
            droppedFile = e.originalEvent.dataTransfer.files[0];
            console.log(droppedFile.name);
            openFile(droppedFile);
        });
    }
}

var showFile = function(file) {
	var filenamesplit = file.name.split(".");
	document.getElementById("analyzeButton").className = "disabledLI";
	var filetype = filenamesplit[filenamesplit.length - 1];
	if (filetype == "mp3" || filetype == "wav"){
		document.getElementById("uploaded").textContent = "Uploaded " + file.name;
		document.getElementById("analyzeButton").className = "";
	}
	else {
		document.getElementById("uploaded").textContent = "Please input a .mp3 or .wav file.";
	}
}

var toggleButtons = function(file) {
	console.log(recordB);
	if(recordB){
		document.getElementById("onRecord").style.display = "none";
		recordB = false;
	}
	else{
		document.getElementById("onRecord").style.display = "block";
		recordB = true;
	}
}

var showFileRecorder = function(file) {
	document.getElementById("analyzeButton").className = "disabledLI";
	if(!isPlaying){
		document.getElementById("uploaded").textContent = "Recording...";
		document.getElementById("startR").className = "disabledLI recordIcon fa fa-circle"
		// document.getElementById("analyzeButton").className = "";
	}
	else{
		document.getElementById("uploaded").textContent = "Recorded";
		document.getElementById("analyzeButton").className = "";
		document.getElementById("startR").className = "recordIcon fa fa-circle"
		document.getElementById("onRecord").style.display = "none";
		recordB = false;
	}
}

var openFile = function(file) {
    showFile(file);
    var reader = new FileReader();
    reader.onload = function() {
        var arrayBuffer = reader.result;
		audioContext.decodeAudioData(arrayBuffer, function(buffer) {
			theBuffer = buffer;
		});
        //console.log("byteLength: " + arrayBuffer.byteLength);
    };
    reader.readAsArrayBuffer(file);
};

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia =
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect(analyser);
    updatePitch();
}

function getUserMediaRecorder(dictionary, callback) {
    try {
		console.log('isPlaying: ' + isPlaying);
		if(isPlaying){
			navigator.getUserMedia =
			navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia;
			navigator.getUserMedia(dictionary, callback, error);
		}

    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function toggleLiveInput() {
	showFileRecorder(file);
	if (isPlaying) {
		console.log("should stop");
	    //stop playing and return
	    // sourceNode.stop( 0 );
	    sourceNode = null;
	    analyser = null;
	    isPlaying = false;
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
	    window.cancelAnimationFrame( rafID );
		// return "Start";
	}
	else{
		isPlaying = true;
	}

	getUserMediaRecorder(
	   {
		   "audio": {
			   "mandatory": {
				   "googEchoCancellation": "false",
				   "googAutoGainControl": "false",
				   "googNoiseSuppression": "false",
				   "googHighpassFilter": "false"
			   },
			   "optional": []
		   },
	   }, gotStream);
	//    navigator = null;
}


function togglePlayback() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop(0);
        sourceNode = null;
        analyser = null;
        isPlaying = false;
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame(rafID);
        return "Start";
    }

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = theBuffer;
    sourceNode.loop = false; // Don't repeat the song

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    sourceNode.start(0);
    isPlaying = true;
    isLiveInput = false;

    updatePitch();

    return "Stop";
}

var rafID = null;
var tracks = null;
var buflen = 1024;
var buf = new Float32Array(buflen);

// Helper functions to calculate the note
function noteFromPitch(frequency) {
	var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
	return Math.round(noteNum) + 69;
}

function frequencyFromNoteNumber(note) {
	return 440 * Math.pow(2, (note - 69) / 12);
}

function centsOffFromPitch(frequency, note) {
	return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
}

var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.

// The "bar" for how close a correlation needs to be
// 0.999 appears to be the highest, anything higher results in no notes
var GOOD_ENOUGH_CORRELATION = 0.99;

function autoCorrelate(buf, sampleRate) {
	var SIZE = buf.length;
	var MAX_SAMPLES = Math.floor(SIZE / 2);
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;
	var foundGoodCorrelation = false;
	var correlations = new Array(MAX_SAMPLES);

	for (var i = 0; i < SIZE; i++) {
		var val = buf[i];
		rms += val * val;
	}
	rms = Math.sqrt(rms / SIZE);
	if (rms < 0.01) // not enough signal
		return -1;

	var lastCorrelation = 1;
	for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i = 0; i < MAX_SAMPLES; i++) {
			correlation += Math.abs((buf[i]) - (buf[i + offset]));
		}
		correlation = 1 - (correlation/MAX_SAMPLES);
		correlations[offset] = correlation; // store it, for the tweaking we need to do below.
		if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
			foundGoodCorrelation = true;
			if (correlation > best_correlation) {
				best_correlation = correlation;
				best_offset = offset;
			}
		} else if (foundGoodCorrelation) {
			// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
			// Now we need to tweak the offset - by interpolating between the values to the left and right of the
			// best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
			// we need to do a curve fit on correlations[] around best_offset in order to better determine precise
			// (anti-aliased) offset.

			// we know best_offset >=1,
			// since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
			// we can't drop into this clause until the following pass (else if).
			var shift = (correlations[best_offset + 1] - correlations[best_offset - 1])/correlations[best_offset];

            // for testing
            //console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
			return sampleRate/(best_offset+(8*shift));
		}
		lastCorrelation = correlation;
	}
	if (best_correlation > 0.01) {
		//console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
		return sampleRate/best_offset;
	}
	return -1;
//	var best_frequency = sampleRate/best_offset;x
}

// Array of all the notes analyzed, entries in the form (pitch, start_time, end_time)

var notes = [];
var arraydetect1 = [];
var arraydetect2 = [];
var count = 0;
function updatePitch(time) {
	var cycles = new Array;
	analyser.getFloatTimeDomainData(buf);
	var pitch = autoCorrelate(buf, audioContext.sampleRate);

    // Check if it was accurate enough (-1 means no accurate match)
 	if (pitch != -1) {
        var rms = 0;
		//measuring intensity of note

		for (var i = 0; i < buf.length; i++) {
			rms += buf[i] * buf[i];
		}
		rms /= buf.length;
		rms = Math.sqrt(rms);
		var curr_note = noteFromPitch(pitch);

		if (arraydetect1.length == 0){
			arraydetect1.push([rms, curr_note, time]);
		}
		else{
			if (rms - arraydetect1[arraydetect1.length - 1][0] > 0.003){

				var result = arraydetect1.slice(0,arraydetect1.length*(2/5) + 1);
				var new_result = [];
				for(j = 0; j < result.length; j++){
					new_result.push(result[j][1]);
				}
				var histo = histogram(new_result)
				//console.log("end" + new_result + " histo : " + histo + "rms :" + rms + "loud: " + arraydetect1[arraydetect1.length - 1][0]); debug
				if(result.length > 2){
					notes.push([histo, arraydetect1[0][2], time]);
					console.log(histo);
				}
				arraydetect1 = [];
			}
			else{
				arraydetect1.push([rms, curr_note, time])
				if(arraydetect1.length > 2){
					displaySheet();
				}

			}
		}
		console.log("pitch: " + curr_note + "         value: " + rms + "       time: " + time);
	/* old algorithm
        // Get current note and the previous note

        if (notes.length != 0) {
            var prev_note = notes[notes.length - 1][0];
        }

        // Debugging
		console.log("pitch: " + curr_note + "         value: " + rms + "       time: " + time);

        // If the previous note is not the same as the current note, add new entry
        if (curr_note != prev_note) {
            if (notes.length != 0) {
                notes[notes.length - 1][2] = time; // Record the end time (ms) for previous note
            }
            notes.push([curr_note, time]); // Record new note and start time (ms)
        }
		*/
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
	rafID = window.requestAnimationFrame(updatePitch);
    //setInterval(updatePitch, 1000/2); // Call updatePitch 60 times a second
}

function histogram(store){
	var frequency = {};  // array of frequency.
	var max = 0;  // holds the max frequency.
	var result;   // holds the max frequency element.
	for(var v in store) {
		frequency[store[v]]=(frequency[store[v]] || 0)+1; // increment frequency.
		if(frequency[store[v]] > max) { // is this frequency > max so far ?
				max = frequency[store[v]];  // update max.
				result = store[v];          // update result.
		}
	}
	return result;
}

function displaySheet() {
    var notesContent = document.getElementById("notesContent");
    notesContent.innerHTML = ""; // Clear the previous sheet
    create(notes);  // Create the new sheet (notes.js)
}

function resetpage(){
	location.reload();
}
