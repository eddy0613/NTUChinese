var audioContext = new webkitAudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

/* TODO:
- offer mono option
- "Monitor input" switch
*/

//var SERVER_IP = 'http://140.112.21.28:8015';
var SERVER_IP = 'http://54.213.97.184:8015';

/*  for audio w/ data transfer  */
function sendWaveInBlobToServer(blob, url) {

  var fileReader = new FileReader();
  fileReader.onload = function (event) {
    var base64data = event.target.result;
    console.log(base64data);

    $.ajax({
      url: url + '/sentAudio',
      data: {data: base64data},
      type: 'POST',
      success: onSuccessReturnScoreAndSentece
//function(err){
//	console.log(err);
//      }
    });
  }
  fileReader.readAsDataURL(blob);
}

function onSuccessReturnScoreAndSentece(res) {
	$("#return_score").val(res.return_score);
	console.log(res);
}

function sendAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying audioRecorder.exportMonoWAV( doneEncoding );
}

function drawWave( buffers ) {
    var canvas = document.getElementById( "wavedisplay" );
    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );
}

function doneEncoding( blob ) {
    sendWaveInBlobToServer(blob, SERVER_IP);
    /* Recorder.forceDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++; */
}

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers( drawWave );
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.webkitCancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }
    
    rafID = window.webkitRequestAnimationFrame( updateAnalysers );
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGainNode();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGainNode();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
    if (!navigator.webkitGetUserMedia)
        return(alert("Error: getUserMedia not supported!"));

    navigator.webkitGetUserMedia({audio:true}, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

window.addEventListener('load', initAudio );
