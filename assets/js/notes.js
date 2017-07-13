$(document).ready(function(){
  // Add smooth scrolling to all links
  $("a").on('click', function(event) {

    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;

      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 800, function(){

        // Add hash (#) to URL when done scrolling (default click behavior)
        window.location.hash = hash;
      });
    } // End if
  });
});

function showNotes() {
    var notesDisplay = document.createElement("img");
    notesDisplay.src = "http://i.imgur.com/zRxi9mj.png";
    var content = document.getElementById("notesContent");
    var notesBox = document.createElement("div");
    notesBox.setAttribute("class", "display-box");
    notesBox.id = "display-notes";
    content.appendChild(notesBox);
    notesBox.appendChild(notesDisplay);
}

function showMainBox() {
    var content = document.getElementById("musicsheet");
    content.style.display = "block";
}


function startProcess(){
    // showMainBox();
    var loader = document.getElementById("loader-wrapper");
    var body = document.getElementById("entire-body");
    body.style.transition = "opacity 1s";
    body.style.opacity = "0.8";
    loader.style.display = "block";
    window.setTimeout(function(){
        loader.setAttribute("href", "#main");
        window.location.href = loader.getAttribute("href");
        loader.style.display = "none";
        // console.log(document.querySelector(".scrollTo"));
        // document.querySelector(".scrollTo").scrolly({
		// 		speed: 1000,
		// 		offset: -10
		// 	});
        body.style.transition = "opacity 3s";
        body.style.opacity = "1";
        //create();
    }, 1000);
    if (document.getElementById("uploaded").textContent != "Recorded"){
        togglePlayback(); 
    };

}

VF = Vex.Flow;
var context;
var stave;


// Stave position and width
var x = 20;
var y = 0;
var width = 750;

/* creates the basic parts of the parts of the music sheet
 i.e the lines, stave, time signature
 */
function create(notes) {

    showMainBox();

    // Create an SVG renderer and attach it to the DIV element named "boo".
    var div = document.getElementById("notesContent");
    var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

    // Analyze duration of notes, store in array of (note, duration) pairs
    // eg. (60, "q") middle C, quarter note
    var note_duration = [];
    for (var i in notes) {
        var curr_note = notes[i][0]; // pitch number
        var duration = notes[i][2] - notes[i][1]; // end_time - start_time
        if(determineNoteType(duration) != "too short"){
			note_duration.push([curr_note, determineNoteType(duration)]);
		}
    }

    // Analyze number of notes (number of staves depends on this)
	var total_note_value = 0;
	for (var i in note_duration) {
		var value = note_duration[i][1];
		if (value == 'q'){
			total_note_value+= 1;
		}
		else if(value == 'qr'){
			total_note_value+= 1;
		}
		else if(value == 'h'){
			total_note_value+= 2;
		}
		else if(value == 'w'){
			total_note_value+= 4;
		}
	}
    var notes_per_stave = 8;
    var num_staves = Math.ceil(total_note_value / notes_per_stave) + 1;

    // Configure the rendering context (width, height)
    // Height depends on the number of staves
    renderer.resize(800, num_staves * 100);
    context = renderer.getContext();
    context.setFont("Arial", 20, "").setBackgroundFillStyle("#eed");

	var displacement = 0;
    for (var i = 0; i < num_staves; i++) {
        // Create a stave, each additional stave increase y by 100
        stave = new VF.Stave(x, y + (i * 100), width);

        if (i == 0) { // First stave
            // Add a clef and time signature to the first stave
            stave.addClef("treble").addTimeSignature("4/4");
        } else {
            // Only add a clef to remaining staves
            stave.addClef("treble");
        }

        // Connect it to the rendering context and draw!
        stave.setContext(context).draw();
        var n = notes_per_stave; // For simpler code
		var tempdis = notes_per_stave;

		var summing_notes = 0;
		for(var j = 0 + (i * n) + displacement; j < (n + (i * n) + displacement) && j < note_duration.length ; j++){
			var value = note_duration[j][1];
			var latest_note;
			tempdis = tempdis - 1;
			if (value == 'q'){
				summing_notes+= 1;
				latest_note = 1;
			}
			else if(value == 'qr'){
				summing_notes+= 1;
				latest_note = 1;
			}
			else if(value == 'h'){
				summing_notes+= 2;
				latest_note = 2;
			}
			else if(value == 'w'){
				summing_notes+= 4;
				latest_note = 4;
			}
			if(summing_notes == notes_per_stave || j == note_duration.length - 1){
				addNotes(stave, note_duration.slice(0 + (i * n) + displacement, j + 1), summing_notes);
				displacement = displacement - tempdis;
				tempdis = notes_per_stave;
				break;//exit forloop
			}
			else if(summing_notes > notes_per_stave || j == note_duration.length - 1){
				addNotes(stave, note_duration.slice(0 + (i * n) + displacement, j), summing_notes - latest_note);
				displacement = displacement - tempdis - 1;
				tempdis = notes_per_stave;
				num_staves += 1;
				break;//exit forloop
			}

		}


    }

}

/*
    Determine what a note is based on its duration
    Incomplete, only returns quarter notes for now
*/
function determineNoteType(duration) {
	if (duration <= 180) {
        return 'too short';
    }
	else if ((duration > 180) && (duration <= 300)) {
        return 'q';
    }
	else if ((duration > 300) && (duration <= 650)) {
        return 'q';
    }
    else if ((duration > 375) && (duration <= 650)) {
        return 'q';
    }
    else if ((duration > 650) && (duration <= 800)) {
        return 'q';
    }
    else if ((duration > 800) && (duration <= 1500)) {
        return 'h';
    }
    else if ((duration > 1500) && (duration <= 2250)) {
        return 'w';
    }
	else{
		return 'w';
	}
}

/*
    Addes notes to the sheet
 */
function addNotes(stave, notes, num_beats) {

    var stave_notes = []; // Store notes as a VP.StaveNote object
    for (var i in notes) {
        stave_notes.push(make_note(notes[i]));
    }

    // Create a voice in 4/4 and add above notes
    var voice = new VF.Voice({num_beats: num_beats,  beat_value: 4});
    voice.addTickables(stave_notes);

    // Format and justify the notes to 400 pixels.
    var formatter = new VF.Formatter().joinVoices([voice]).format([voice], width - 50);

    // Render voice
    voice.draw(context, stave);
}

/*
    Returns a VF.StaveNote object given a note number and duration
    Note numbers are generated in upload.js (eg. 60 -> middle C)
 */
function make_note(noteDuration) {

    var note = noteDuration[0];
    var d = noteDuration[1];

    switch (note) {
        case 54:
            note = new VF.StaveNote({clef: "treble", keys: ["f#/3"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 55:
            note = new VF.StaveNote({clef: "treble", keys: ["g/3"], duration: d });
            break;
        case 56:
            note = new VF.StaveNote({clef: "treble", keys: ["g#/3"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 57:
            note = new VF.StaveNote({clef: "treble", keys: ["a/3"], duration: d });
            break;
        case 58:
            note = new VF.StaveNote({clef: "treble", keys: ["a#/3"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 59:
            note = new VF.StaveNote({clef: "treble", keys: ["b/3"], duration: d });
            break;
        case 60:
            note = new VF.StaveNote({clef: "treble", keys: ["c/4"], duration: d });
            break;
        case 61:
            note = new VF.StaveNote({clef: "treble", keys: ["c#/4"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 62:
            note = new VF.StaveNote({clef: "treble", keys: ["d/4"], duration: d });
            break;
        case 63:
            note = new VF.StaveNote({clef: "treble", keys: ["d#/4"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 64:
            note = new VF.StaveNote({clef: "treble", keys: ["e/4"], duration: d });
            break;
        case 65:
            note = new VF.StaveNote({clef: "treble", keys: ["f/4"], duration: d });
            break;
        case 66:
            note = new VF.StaveNote({clef: "treble", keys: ["f#/4"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 67:
            note = new VF.StaveNote({clef: "treble", keys: ["g/4"], duration: d });
            break;
        case 68:
            note = new VF.StaveNote({clef: "treble", keys: ["g#/4"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 69:
            note = new VF.StaveNote({clef: "treble", keys: ["a/4"], duration: d });
            break;
        case 70:
            note = new VF.StaveNote({clef: "treble", keys: ["a#/4"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 71:
            note = new VF.StaveNote({clef: "treble", keys: ["b/4"], duration: d });
            break;
        case 72:
            note = new VF.StaveNote({clef: "treble", keys: ["c/5"], duration: d });
            break;
        case 73:
            note = new VF.StaveNote({clef: "treble", keys: ["c#/5"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 74:
            note = new VF.StaveNote({clef: "treble", keys: ["d/5"], duration: d });
            break;
        case 75:
            note = new VF.StaveNote({clef: "treble", keys: ["d#/5"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 76:
            note = new VF.StaveNote({clef: "treble", keys: ["e/5"], duration: d });
            break;
        case 77:
            note = new VF.StaveNote({clef: "treble", keys: ["f/5"], duration: d });
            break;
        case 78:
            note = new VF.StaveNote({clef: "treble", keys: ["f#/5"], duration: d })
                        .addAccidental(0, new VF.Accidental("#"));
            break;
        case 79:
            note = new VF.StaveNote({clef: "treble", keys: ["g/5"], duration: d });
            break;

        default: // default lowest note in range
            note = new VF.StaveNote({clef: "treble", keys: ["C/4"], duration: d });
            break;
    }
    return note;
}

/*
    similar structure will be required to convert frequency output to required input for
    VF key
 */
function randomNote(){
    var note = Math.floor((Math.random() * 10) + 1);
    switch (note){
        case 1:
            return "c/4";
            break;
        case 2:
            return "b/4";
            break;
        case 3:
            return "a/4";
            break;
        default:
            return "f/4";
            break;
    }

}

function getNotes(notes){
    var finalNotes = new Array();
    for(i=0; i<notes.length; i++){
        finalNotes.push(notes[i]);
    }
    return finalNotes;
}
