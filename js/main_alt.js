var audioContext = new webkitAudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

//var SERVER_IP = 'http://140.112.21.28:8015';
var SERVER_IP = 'http://54.213.97.184:8015';

/*  start of unit mapping to index  */
var Unit2NumMapping = {};
var Num2UnitMapping = {};
$.get('dialogueTreeFile/IF_tone_withBoundary.list.revised', function(data) {
	var dialogueFile = data.split('\n');
	for (i=0;i<dialogueFile.length-1;i++) {
		Unit2NumMapping[dialogueFile[i]] = i.toString();
		Num2UnitMapping[i.toString()] = dialogueFile[i];
	};
console.log(Unit2NumMapping);
console.log('jojo');
console.log(Num2UnitMapping);
});
/*  end of unit mapping to index  */

/*  start of dialogueTree line IF storage  */
var dialogueTreeLineIF = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.IF', function(data) {
	var dialogueFile = data.split('\n');
	for (i=0;i<dialogueFile.length-1;i++) {
		var tmpArray = dialogueFile[i].split(' ');
		tmpArray.splice(tmpArray.length-1,1);
		dialogueTreeLineIF.push(tmpArray);
	}
console.log(dialogueTreeLineIF);
});
/*  end of dialogueTree line IF storage  */

/*  start of dialogueTree line tone storage  */
var dialogueTreeLineTone = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.tone', function(data) {
	var dialogueFile = data.split('\n');
	dialogueFile.splice(dialogueFile.length-1,1);
	dialogueTreeLineTone = dialogueFile;
//	for (i=0;i<dialogueFile.length-1;i++) {
//		var tmpArray = dialogueFile[i].split(' ');
//		tmpArray.splice(tmpArray.length-1,1);
//		dialogueTreeLineTone.push(tmpArray);
//	}
console.log(dialogueTreeLineTone);
});
/*  end of dialogueTree line tone storage  */

/*  start of dialogue demo index to experiment index  */
var demo2experimentMapping = {};
var experiment2demoMapping = {};
$.get('algorithms/corpus/cycle_tree/demo_experiment_index_mapping', function(data) {
    var dialogueFile = data.split('\n');
    for (i=0;i<dialogueFile.length-1;i++) {  // i don't know why it should be dialogueFile.length-1, not dialogueFile.length
        var tmpArray = dialogueFile[i].split('\t');
        demo2experimentMapping[tmpArray[0]] = tmpArray[1];
        experiment2demoMapping[tmpArray[1]] = tmpArray[0];
    };
});
/*  end of dialogue demo index to experiment index  */


/*  start of dialogue tree line count  */
var dialogueTreeLineCount = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.line.count', function(data) {
	var dialogueFile = data.split('\n');
	for (i=0;i<dialogueFile.length-1;i++) {
		var tmpArray = dialogueFile[i].split(' ');
		tmpArray.splice(tmpArray.length-1,1);
		dialogueTreeLineCount.push(tmpArray);
	}
console.log(dialogueTreeLineCount);
});
/*  end of dialogue tree line count  */



/*  start of initialize user performance dictionary  */
var totalUnitNum = 101.0;
var userPerformance = {};
userPerformance['userUnitScores'] = [];
userPerformance['userUnitPracticeCount'] = [];

for (i=0;i<totalUnitNum;i++) {
	userPerformance['userUnitScores'].push(101.0);
}
for (i=0.0;i<totalUnitNum;i++) {
	userPerformance['userUnitPracticeCount'].push(0.0);
}
for (i=0.0;i<totalUnitNum;i++) {
	userPerformance[i.toString()] = [];
}
console.log(userPerformance);
/*  end of initialize user performance dictionary  */

function addScore2UserPerformance(scores) {
	//scores.splice(0,1); // delete total score content

	humanExperimentIndex = demo2experimentMapping[humanSentenceSelectionID];

	var d = dialogueTreeLineIF[humanExperimentIndex];

	/*  for user unit score  */	
	for (i=1;i<scores.length;i++) {
		var s = scores[i].split(',');
		console.log(s);
		if (s.length == 6){
			userPerformance[Unit2NumMapping[d[2*(i-1)]]].push(s[1]);
			userPerformance[Unit2NumMapping[d[2*(i-1)+1]]].push(s[2]);
		}
		else if (s.length == 5){
			userPerformance[Unit2NumMapping[d[2*(i-1)]]].push(s[1]);
			userPerformance[Unit2NumMapping[d[2*(i-1)+1]]].push(s[1]);
		}
	}

	/*  for user unit count  */	
	for (i=0.0;i<totalUnitNum;i++) {
		userPerformance['userUnitPracticeCount'][i] += dialogueTreeLineCount[humanExperimentIndex][i];
	}

	updateUserPerformance();
}

function updateUserPerformance() {
	for (i=0.0;i<totalUnitNum;i++) {
		var unitSum = 0.0;
		unitPerformanceLength = userPerformance[i.toString()].length;
		for (j=0;j<unitPerformanceLength;j++) {
			unitSum += parseFloat(userPerformance[i.toString()][j]);
		}
		if (unitPerformanceLength == 0.0)
			userPerformance['userUnitScores'][i] = 101.0;
		else {
			userPerformance['userUnitScores'][i] = parseFloat(unitSum/(unitPerformanceLength));
			console.log(userPerformance['userUnitScores'][i]+' haha '+unitPerformanceLength);
			console.log(i);
			console.log(Num2UnitMapping[i.toString()]);
		}
		unitSum = 0.0;
	}
}


/*  for audio w/ data transfer  */
function sendWaveInBlobToServer(blob, url) {

  var fileReader = new FileReader();
  fileReader.onload = function (event) {
    var base64data = event.target.result;
    console.log(base64data);
    
	$.ajax({
      url: url + '/sentAudio',
      data: {data: base64data,},
      type: 'POST',
      success: onSuccessReturnScoreAndSentece
    });
  }
  fileReader.readAsDataURL(blob);
}

// for jQuery test
$('#date').datepicker();
$('a[data-toggle=tooltip]').mouseover(function() { 
   console.log('got you!');
   $(this).tooltip('show'); 
   });


function onSuccessReturnScoreAndSentece(res) {
	var scores = res.return_score.split('\n');
	scores.splice(scores.length-1,1);
	console.log(scores);

	addScore2UserPerformance(scores);	

	// whole score
	var wholeScore = scores[0].split(',');
	$("#totalScore").empty();
	$("#pronunScore").empty();
	$("#toneScore").empty();
	$("#timingScore").empty();
	$("#emphasisScore").empty();
	$('<h4 class="text-center">' + wholeScore[0] + '</h4>').appendTo("#totalScore");
	$('<h4 class="text-center">' + wholeScore[1] + '</h4>').appendTo("#pronunScore");
	$('<h4 class="text-center">' + wholeScore[2] + '</h4>').appendTo("#toneScore");
	$('<h4 class="text-center">' + wholeScore[3] + '</h4>').appendTo("#timingScore");
	$('<h4 class="text-center">' + wholeScore[4] + '</h4>').appendTo("#emphasisScore");
	console.log(wholeScore);

	// detail score
	$('#scoreDetail').empty();
	for (i=1;i<scores.length;i++) {
//		$('<td><a data-toggle="popover" title="Score" data-content='+scores[i]+'>'+scores[i][0]+'</a></td>').appendTo("#scoreDetial");
		$('<td><tag data-toggle="popover" title="Score" data-content='+scores[i]+'>'+scores[i]+'</a></td>').appendTo("#scoreDetail");
	}

	$("#return_score").val(res.return_score);
	console.log(res);
	getDialogueContent();
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
    

// global variables
var selectedCourseArray = [];
var selectedUnitType = 1;
var userName = "Eddy";

var userCurrentSelectionID = [];

$("#dialogueContent").hide();

function onclickStart(){
	// Reset course and unitType selection
	selectedCourseArray = [];
	selectedUnitType = 0;
	
	// Store selected course
	$(':checkbox[name="CourseID"]:checked').each (function () {
		    selectedCourseArray.push(this.value);
		      });

	// Store selected unitType
	selectedUnitType = $(':radio[name="UnitType"]:checked').val()

	//alert(selectedCourseArray);
	//alert(selectedUnitType);
	sendUserInfo();
	updateHumanSelection();
	getDialogueContent();
	$("#userSelectInformation").hide();
	$("#dialogueContent").show();
}

function preventFormSubmit() {
	sendUserInfo();
	return false;
}

function sendUserInfo() {
	var sendData = {
		"userName":userName,
		"selectedCourseID":selectedCourseArray,
		"selectedUnitTypeID":selectedUnitType
	}
	$.ajax({
		url: SERVER_IP + '/info',
		type: "POST",
		data: sendData,
		dataType: 'JSON'
	});
}

function updateHumanSelection() {
	var sendData = {
		"humanSentenceSelectionID":humanSentenceSelectionID,
		"userUnitScores":userPerformance['userUnitScores']
	}
	$.ajax({
		url: SERVER_IP + '/updateHumanSelection',
		type: "GET",
		data: sendData,
		success: onSuccess,
	});
}

function getDialogueContent() {
	$.ajax({
		url: SERVER_IP + '/dialogueContent',
		type: "GET",
		success: onSuccess,
	});
}

var humanSentenceSelection = [];
var humanSentenceChoice = [];
var humanSentenceSelectionID = '000';

function imagePlay(){
	$("#sentenceAudio:last").attr("src",this.id).get(0).play();
}

function onSuccess(res) {
	// clear user selectionBox choices
	$("#selectionBox").empty();

	humanSenteceSelection = res.Human;
	humanSentenceChoice = res.HumanSentenceID;
	
//	$("<div class='bubbledLeft'>"+ res.Computer[1]+ "</div><audio id='sentenceAudio' src='dialogueTree_wav/" + res.dialogueIndex + "'.wav autoplay> </audio>").appendTo("#dialogueContentSection");
//	$("<div class='bubbledLeft'><span class='playMedia' src='img/save.svg' onclick='imagePlay()'>"+ res.Computer[1]+ "</span></div><audio id='sentenceAudio' src='dialogueTree_wav/" + res.dialogueIndex + "'.wav autoplay> </audio>").appendTo("#dialogueContentSection");
	$("<div class='bubbledLeft playMedia' onclick='imagePlay()'>"+ res.Computer[1]+ "</div><audio id='sentenceAudio' src='dialogueTree_wav/" + res.dialogueIndex + "'.wav autoplay> </audio>").appendTo("#dialogueContentSection");
	console.log('dialogueTree_wav/' + res.dialogueIndex +'.wav');

	var min = 0;
	var max = res.Human.length - 1;
	flag = Math.floor(Math.random() * (max - min + 1)) + min;
	
	for (i=0;i<res.Human.length;i++){
		if (res.HumanSentenceID[i] == res.recommendedIndex)
			$("<label class='btn btn-block btn-info'><input class='sentenceSelect' type='radio' name='CourseID' value="+i+" checked>"+res.Human[i][1]+"</label>").appendTo("#selectionBox");
		else
			$("<label class='btn btn-block btn-default'><input class='sentenceSelect' type='radio' name='CourseID' value="+i+">"+res.Human[i][1]+"</label>").appendTo("#selectionBox");
	}
	console.log(JSON.stringify(res.Human[0][1]));
}

function confirmUserSelection() {
	selectionFlag = $(".sentenceSelect:checked").val();
	$("<div class='bubbledRight'>"+ humanSenteceSelection[selectionFlag][1] + "</div>").appendTo("#dialogueContentSection");
	humanSentenceSelectionID = humanSentenceChoice[selectionFlag];
	console.log(humanSentenceSelectionID);
	updateHumanSelection();
}
	
