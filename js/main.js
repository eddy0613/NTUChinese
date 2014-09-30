var audioContext = new webkitAudioContext();
var audioInput = null,
	realAudioInput = null,
	inputPoint = null,
	audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

var userTime = new Date();

var turnVector=[];
var BUSC=""; //backup selection content
var selectionFlag=-1;
var pR=[]; //poorRetroflex

var SERVER_IP = 'http://140.112.21.28:8015';
//var SERVER_IP = 'http://54.213.97.184:8015';

/*  start of unit mapping to index  */
var Unit2NumMapping = {};
var Num2UnitMapping = {};
$.get('dialogueTreeFile/IF_tone_withBoundary.list.revised', function(data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {
	Unit2NumMapping[dialogueFile[i]] = i.toString();
	Num2UnitMapping[i.toString()] = dialogueFile[i];
	};
	//console.log(Unit2NumMapping);
	//console.log('jojo');
	//console.log(Num2UnitMapping);
	});
/*  end of unit mapping to index  */

/*  start of dialogueTree line IF storage  */
var dialogueTreeLineIF = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.IF', function(data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {
	var tmpArray = dialogueFile[i].split(' ');
	tmpArray.splice(tmpArray.length-1,1);
	dialogueTreeLineIF.push(tmpArray);
	}
	});
/*  end of dialogueTree line IF storage  */

/*  start of dialogueTree line IF w/ punctuation storage  */
var IF_punc = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.IF.withPunct', function(data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {
	var tmpArray = dialogueFile[i].split(' ');
	tmpArray.splice(tmpArray.length-1,1);
	IF_punc.push(tmpArray);
	}
	});
/*  end of dialogueTree line IF w/ punctuaion storage  */

/*  start of dialogueTree line tone storage  */
var dialogueTreeLineTone = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.tone', function(data) {
	var dialogueFile = data.split('\n');
	//dialogueFile.splice(dialogueFile.length-1,1);
	//dialogueTreeLineTone = dialogueFile;
	for (var i=0;i<dialogueFile.length-1;i++) {
	var tmpArray = dialogueFile[i].split(' ');
	tmpArray.splice(tmpArray.length-1,1);
	dialogueTreeLineTone.push(tmpArray);
	}
	});
/*  end of dialogueTree line tone storage  */

/*  start of dialogueTree line tone w/ punctuaion storage  */
var Tone_punc = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.tone.withPunct', function(data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {
	  var tmpArray = dialogueFile[i].replace(/\s+/g, '');
	  tmpArray = tmpArray.split('');
	  Tone_punc.push(tmpArray);
	}
	});
/*  end of dialogueTree line tone w/ punctuation storage  */

/*  start of dialogue demo index to experiment index  */
var demo2experimentMapping = {};
var experiment2demoMapping = {};
$.get('algorithms/corpus/cycle_tree/demo_experiment_index_mapping', function(data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {  // i don't know why it should be dialogueFile.length-1, not dialogueFile.length
	var tmpArray = dialogueFile[i].split('\t');
	demo2experimentMapping[tmpArray[0]] = tmpArray[1];
	experiment2demoMapping[tmpArray[1]] = tmpArray[0];
	};
	//console.log(demo2experimentMapping);
	//console.log(experiment2demoMapping);
	});
/*  end of dialogue demo index to experiment index  */


/*  start of dialogue tree line count  */
var dialogueTreeLineCount = [];
$.get('dialogueTreeFile/cycle_tree_for_demo.line.count', function(data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {
	var tmpArray = dialogueFile[i].split(' ');
	tmpArray.splice(tmpArray.length-1,1);
	dialogueTreeLineCount.push(tmpArray);
	}
	//console.log(dialogueTreeLineCount);
	});
/*  end of dialogue tree line count  */


var rNum=[];

/*  start of initialize user performance dictionary  */
var totalUnitNum = 101.0;
var userPerformance = {};
userPerformance['userUnitScores'] = [];
userPerformance['userUnitPracticeCount'] = [];
var userScoreLog = [];

for (var i=0;i<totalUnitNum;i++) {
  userPerformance['userUnitScores'].push(101.0);
}
for (var i=0.0;i<totalUnitNum;i++) {
  userPerformance['userUnitPracticeCount'].push(0.0);
}
for (var i=0.0;i<totalUnitNum;i++) {
  userPerformance[i.toString()] = [];
}
console.log(userPerformance);
/*  end of initialize user performance dictionary  */

function addScore2UserPerformance(scores) {
  //scores.splice(0,1); // delete total score content

  altered = Math.floor(humanSentenceSelectionID/100)-1;
  temp = parseInt(demo2experimentMapping[humanSentenceSelectionID])+altered;
  humanExperimentIndex = temp.toString();
  turnVector.push(humanSentenceSelectionID);	
  //humanExperimentIndex = demo2experimentMapping[humanSentenceSelectionID];

  var d = dialogueTreeLineIF[humanExperimentIndex];
  var tone = dialogueTreeLineTone[humanExperimentIndex];
  var toneScore=[];
  uniStart=58; //uni-tone starting index  
  biStart =63; //bi-tone
  crStart =82; //cross
  pR=[];
  /*  for user unit score  */	
  for (var i=1;i<scores.length;i++) {
	var s = scores[i].split(',');
	//console.debug(s);
	if (s.length == 6){
	  if(document.getElementById('poorRetroflex').checked &&
		( d[2*(i-1)]=='j' || d[2*(i-1)]=='ch' || d[2*(i-1)]=='sh' || d[2*(i-1)]=='r')){
		var r=40+Math.ceil(Math.random()*20-10);
		s[1]=r;
		pR.push(r);
	    console.debug('poorRetroflex:'+i+", "+r);
	  }
	  userPerformance[Unit2NumMapping[d[2*(i-1)]]].push(s[1]);
	  if(d[2*(i-1)+1]!='iai' && d[2*(i-1)+1]!='ua')
		userPerformance[Unit2NumMapping[d[2*(i-1)+1]]].push(s[2]);
	}
	else if (s.length == 5){
	  if(document.getElementById('poorRetroflex').checked &&
		( d[2*(i-1)]=='j' || d[2*(i-1)]=='ch' || d[2*(i-1)]=='sh' || d[2*(i-1)]=='r')){
		var r=40+Math.ceil(Math.random()*20-10);
		s[1]=r;
		pR.push(r);
	    console.debug('poorRetroflex:'+i+", "+r);
	  }
	  userPerformance[Unit2NumMapping[d[2*(i-1)]]].push(s[1]);
	  if(d[2*(i-1)+1]!='iai' && d[2*(i-1)+1]!='ua')
		userPerformance[Unit2NumMapping[d[2*(i-1)+1]]].push(s[1]);
	}
	//toneScore.push(Math.ceil(Math.random()*100));	
	toneScore.push(parseFloat(s[s.length-3]));	//tone score's index
  }
  /* for tone scores*/
  lastNum=0;lastScore=0;
  for(var i=0,si=0;i<tone.length;i++){	//si: tone scores index
	N = tone[i];
	digit=1;num=1;
	for(var j=N;j>0;j-=Math.pow(10,digit)*num){
	  digit = Math.floor(Math.log(j)/Math.log(10)); 
	  num   = Math.floor(j/Math.pow(10,digit));
	  userPerformance[uniStart+(num-1)].push(toneScore[si]);
	  if(j!=N){	//not the first tone of a phrase
		var biNum = lastNum*10+num;
		biNum = biNum.toString();
		if(biNum in Unit2NumMapping){
		  userPerformance[Unit2NumMapping[biNum]].push( (toneScore[si]+lastScore)/2 );
		}
	  }
	  else if(i!=0){	//the first tone of a phrase and the phrase is not the first one
		var crNum = lastNum*10+num;  
		crNum = "b"+crNum.toString();
		if(crNum in Unit2NumMapping){
		  userPerformance[Unit2NumMapping[crNum]].push( (toneScore[si]+lastScore)/2 );
		  //console.log('crNum:'+crNum+' mapping to '+Unit2NumMapping[crNum]);  
		}
	  }
	  lastNum=num;
	  lastScore=toneScore[si];
	  si++;
	}

  }
  /*  for user unit count  */	
  for (var i=0.0;i<totalUnitNum;i++) {
	userPerformance['userUnitPracticeCount'][i] += dialogueTreeLineCount[humanExperimentIndex][i];
  }

  updateUserPerformance();
}

function updateUserPerformance() {
  for (var i=0.0;i<totalUnitNum;i++) {
	var unitSum = 0.0;
	unitPerformanceLength = userPerformance[i.toString()].length;
	for (var j=0;j<unitPerformanceLength;j++) {
	  unitSum += parseFloat(userPerformance[i.toString()][j]);
	}
	if (unitPerformanceLength == 0.0)
	  userPerformance['userUnitScores'][i] = 101.0;
	else {
	  userPerformance['userUnitScores'][i] = parseFloat(unitSum/(unitPerformanceLength));
	  //console.log(userPerformance['userUnitScores'][i]+' haha '+unitPerformanceLength);
	  //console.log(i);
	  //console.log(Num2UnitMapping[i.toString()]);
	}
	unitSum = 0.0;
  }
  updateBarChart();
}

function updateBarChart() {
  var printableScoreIF = [];
  var printableScoreTone = [];
  var highlightScoreIF = [];
  var printableCountIF=[],compareLineIF=[];
  var printableCountTone=[],compareLineTone=[];
  var oldIFScore=[],oldToneScore=[];
  var Unit2ScoreMapping = {};
  //to prevent from changing the userUnitScores
  var cloneScore = userPerformance['userUnitScores'].slice(0);
  userScoreLog.push(cloneScore);
  printableNum = 101;
  var IF = [];
  var Tone=[];
  var googleDataCurrentIF = [],googleDataCurrentTone = [];
  googleDataCurrentIF.push(['Unit','Score','Retroflex Score']);
  googleDataCurrentTone.push(['Unit','Score']);
  document.getElementById("CurrentIF").style.height="300px";
  document.getElementById("CurrentTone").style.height="300px";
  for (var i=0;i<printableNum;i++){
	if(i<58)//IF
	  IF[i]=Num2UnitMapping[i];
	else//Tone
	  Tone[i-58]=Num2UnitMapping[i];
  }
  for(var i=0;i<IF.length;i++){
  	var tmpArray=[];
   	tmpArray.push(IF[i]);
	if(i>=14 && i<=17){		//retroflex consonants should be highlighted
	  tmpArray.push(0);
	  if(userPerformance['userUnitScores'][i]<=100)
		tmpArray.push(userPerformance['userUnitScores'][i]);
	  else
		tmpArray.push(0.0001);
	}
	else{
	  if(userPerformance['userUnitScores'][i]<=100)
		tmpArray.push(userPerformance['userUnitScores'][i]);
	  else
		tmpArray.push(0.0001);
  	  tmpArray.push(0);
	}
    googleDataCurrentIF.push(tmpArray);
  }
  var googleDataCurrentIF2 = google.visualization.arrayToDataTable(googleDataCurrentIF);
  var optionCurrentIF = {
	title : 'Present',
	width: 1500,
	height: 300,
	animation: {duration:500},
	vAxes: {0:{title: "Average Score"}},
	hAxis: {title: "Acoustic Units(Initials/Finals)",slantedText:true,textStyle:{fontSize:10},maxAlternation:3},
	seriesType: "bars",
	series: {0:{targetAxisIndex:0,color:'Gainsboro'},1:{targetAxisIndex:0,color:'red'}}
  	 };
  var currentChartIF = new google.visualization.ComboChart(document.getElementById('CurrentIF'));
  currentChartIF.draw(googleDataCurrentIF2,optionCurrentIF);
  for(var i=0;i<Tone.length;i++){
    var tmpArray=[];
   	tmpArray.push(Tone[i]);
	if(userPerformance['userUnitScores'][i]<=100)
	  tmpArray.push(userPerformance['userUnitScores'][i]);
	else
	  tmpArray.push(0.0001);
   	googleDataCurrentTone.push(tmpArray);
  }
  var googleDataCurrentTone2 = google.visualization.arrayToDataTable(googleDataCurrentTone);
  var optionCurrentTone = {
	title : '',
	width: 1500,
	height: 300,
	animation: {duration:500},
	vAxes: {0:{title: "Average Score"}},
	hAxis: {title: "Tone Patterns"},
	seriesType: "bars",
	series: {0:{targetAxisIndex:0,color:'Gainsboro'}}
  	 };
  var currentChartTone = new google.visualization.ComboChart(document.getElementById('CurrentTone'));
  currentChartTone.draw(googleDataCurrentTone2,optionCurrentTone);
  /*  old code for chart.js 
  for (var i=0;i<printableNum;i++){
	if(i<58){//IF
	  highlightScoreIF[i]=0/0;	//ignore the rest scores
	  if(userPerformance['userUnitScores'][i]==101.0)
		printableScoreIF[i]=0.0;
	  else
		printableScoreIF[i]=userPerformance['userUnitScores'][i];  
	  if(i>=14 && i<=17)		//retroflex consonants should be highlighted
		highlightScoreIF[i]=printableScoreIF[i];
	  IF[i]=Num2UnitMapping[i];
	  Unit2ScoreMapping[IF[i]] = printableScoreIF[i];
	}
	else{//Tone
	  if(userPerformance['userUnitScores'][i]==101.0)
		printableScoreTone[i-58]=0.0;
	  else
		printableScoreTone[i-58]=userPerformance['userUnitScores'][i];  
	  Tone[i-58]=Num2UnitMapping[i];
	}
  }
  */
  //var IF_TONE = [];
  //for(var key in Unit2NumMapping){
  //if(Unit2NumMapping.hasOwnProperty(key))
  //		IF_TONE.push(key);
  //}		
  //console.log(printableScore.sort(function(a,b){return a-b}));
  /* we can compare with random policy if the tree is 3,4 or 5*/
  if(selectedCourseArray.indexOf("3")>-1 ||
	  selectedCourseArray.indexOf("4")>-1 ||
	  selectedCourseArray.indexOf("5")>-1){

	/* */
	var dirPath = "algorithms/corpus/random_policy_result/";
	var treePath ="";
	treeNum = Math.floor(humanSentenceSelectionID/100);
	if(selectedCourseArray[0]=="3")
	  treePath="tree3_4/";
	else if (selectedCourseArray[0]=="4")
	  treePath="tree4_5/";
	var tf = 10;	//ten or fifteen
	var tenFifteenPath = tf.toString()+"turns_after/";
	var turn = turnVector.length;
	var turnA=turn-tf,turnStart=turn-tf+1; 
	var turnPath = "after"+turnA.toString()+"_"+turnStart.toString()+"-"+turn.toString()+"/"; 
	var bPath = "random_b";
	//if(turnA<99999){		//quick testing flag
	if(turnA>=5){
	  document.getElementById("RandomCompareIF").style.height="300px";
	  document.getElementById("RandomCompareTone").style.height="300px";
	  var fileStr = dirPath+treePath+tenFifteenPath+turnPath+bPath;
	  //var fileStr = 'algorithms/corpus/random_policy_result/tree3_4/10turns_after/after10_11-20/random_b'; //quick testing flag
	  $.ajaxSetup({async:false});
	  $.get(fileStr, function(data) {
		  rNum=[];
		  var tmp = data.split(' ');
		  for(var i=0;i<tmp.length-1;i++){
		  rNum.push(parseFloat(tmp[i]));
		  }
		  });
	  $.ajaxSetup({async:true});
	  console.debug("rNumlength"+rNum.length);
	  console.debug(userPerformance['userUnitPracticeCount']);
	  console.debug("get in turnA");
	  //if(turn>1)
	  //oldToneScore = userScoreLog[turn-1].slice(0);	//quick testing flag
	  //else
	  //oldToneScore = userScoreLog[0].slice(0);	//quick testing flag

	  oldToneScore = userScoreLog[turnA-1].slice(0);
	  for (var i=0;i<101;i++) {
		var totalCount = calCount(userPerformance['userUnitPracticeCount'][i],turnStart,turn);
		//var totalCount=10;   //quick testing flag
		printableCountTone[i]=(totalCount-rNum[i])/rNum[i];
	    /* prevent rNum==0 situation */
		if(printableCountTone[i]==Infinity || isNaN(printableCountTone[i]))
		  printableCountTone[i]=0.0;
		compareLineTone[i]=0.0;
	    if(oldToneScore[i]==101.0)
		  oldToneScore[i]=0.0;
	  }
	  oldIFScore = oldToneScore.splice(0,58);
	  printableCountIF = printableCountTone.splice(0,58);
	  compareLineIF = compareLineTone.splice(0,58);
	  console.log(turnVector.length+" "+printableCountIF);
	  console.log(turnVector.length+" "+printableCountTone);
	  var googleDataCompareIF = [],googleDataCompareTone = [];
	  googleDataCompareIF.push(['Unit','Score','Retroflex Score','Percentage Over Random']);
	  googleDataCompareTone.push(['Unit','Score','Percentage Over Random']);
  	  for(var i=0;i<IF.length;i++){
		var tmpArray=[];
    	tmpArray.push(IF[i]);
		if(i>=14 && i<=17){		/* retroflex consonants should be highlighted */
  		  tmpArray.push(0);
		  tmpArray.push(oldIFScore[i]);
		}
		else{
		  tmpArray.push(oldIFScore[i]);
  		  tmpArray.push(0);
		}
		tmpArray.push(printableCountIF[i]);
    	googleDataCompareIF.push(tmpArray);
  	  }
  	  var googleDataCompareIF2 = google.visualization.arrayToDataTable(googleDataCompareIF);
  	  for(var i=0;i<Tone.length;i++){
		var tmpArray=[];
    	tmpArray.push(Tone[i]);
		tmpArray.push(oldToneScore[i]);
		tmpArray.push(printableCountTone[i]);
    	googleDataCompareTone.push(tmpArray);
  	  }
		console.debug("rNum"+rNum);
		console.debug("IF"+printableCountIF);
		console.debug("Tone"+printableCountTone);
  	  var googleDataCompareTone2 = google.visualization.arrayToDataTable(googleDataCompareTone);

      // Create and draw the visualization.
 	  var optionCompareIF = {
		title : '10 dialogue turns before',
		width: 1500,
		height: 300,
		animation: {duration:500},
		vAxes: {0:{title: "Average Score"},1:{title:"Percentage of Extra Practice over Random",format:'#%'}},
		hAxis: {title: "Acoustic Units(Initials/Finals)",slantedText:true,textStyle:{fontSize:10},maxAlternation:3},
		legend: {position: 'top'},
		seriesType: "bars",
		series: {0:{targetAxisIndex:0,color:'Gainsboro'},1:{targetAxisIndex:0,color:'red'},2:{targetAxisIndex:1,color:'orange',type: "line"}}
  	  };
  	  var compareChartIF = new google.visualization.ComboChart(document.getElementById('RandomCompareIF'));
  	  compareChartIF.draw(googleDataCompareIF2,optionCompareIF);
 	  var optionCompareTone = {
		title : '',
		width: 1500,
		height: 300,
		animation: {duration:500},
		vAxes: {0:{title: "Average Score"},1:{title:"",format:'#%'}},
		hAxis: {title: "Tone Patterns"},
		legend: {position: 'top'},
		seriesType: "bars",
		series: {0:{targetAxisIndex:0,color:'Gainsboro'},1:{targetAxisIndex:1,color:'orange',type: "line"}}
  	  };
  	  var compareChartTone = new google.visualization.ComboChart(document.getElementById('RandomCompareTone'));
  	  compareChartTone.draw(googleDataCompareTone2,optionCompareTone);
	}
  }
  /* old data for chart.js
  var lineChartDataIF={
labels : IF,
		 datasets: [
		 {
fillColor : "rgba(220,220,220,0)",
			strokeColor : "rgba(220,220,220,1)",
			pointColor : "rgb(220,200,40,1)",
			pointStrokeColor : "#fff",  
			data: printableCountIF
		 },
		 {
fillColor : "rgba(150,0,0,0)",
			strokeColor : "rgba(151,30,0,1)",
			pointColor : "rgb(150,20,30,1)",
			pointStrokeColor : "#fff",  
			data: compareLineIF
		 }
		 ]
  }
  var lineChartDataTone={
labels : Tone,
		 datasets: [
		 {
fillColor : "rgba(220,220,220,0)",
			strokeColor : "rgba(220,220,220,1)",
			pointColor : "rgb(220,200,40,1)",
			pointStrokeColor : "#fff",  
			data: printableCountTone
		 },
		 {
fillColor : "rgba(150,0,0,0)",
			strokeColor : "rgba(151,30,0,1)",
			pointColor : "rgb(150,20,30,1)",
			pointStrokeColor : "#fff",  
			data: compareLineTone
		 }
		 ]
  }
  var barChartDataIF = {
labels : IF,
		 //labels : Object.keys(Unit2ScoreMapping).sort(function(a,b){return Unit2ScoreMapping[a]-Unit2ScoreMapping[b]}),
		 datasets : [
		 {
fillColor : "rgba(220,220,220,1)",
			strokeColor : "rgba(220,220,220,1)",
			data: printableScoreIF
			  //data : [65,59,90,81,56,55,40]
		 },
		 {
fillColor : "rgba(255,59,96,1)",
			strokeColor : "rgba(151,187,205,0)",
			data: highlightScoreIF
			  //data : [28,48,40,19,96,27,100]
		 }
		 ]
  }
  var barChartDataTone = {
labels : Tone,
		 //labels : Object.keys(Unit2ScoreMapping).sort(function(a,b){return Unit2ScoreMapping[a]-Unit2ScoreMapping[b]}),
		 datasets : [
		 {
fillColor : "rgba(220,220,220,1)",
			strokeColor : "rgba(220,220,220,1)",
			data: printableScoreTone
		 },
		 {
fillColor : "rgba(220,220,220,1)",
			strokeColor : "rgba(220,220,220,1)",
			data: printableScoreTone
		 }
		 ]
  }
  var LogIF = {
labels : IF,
		 datasets : [
		 {
fillColor : "rgba(220,220,220,1)",
			strokeColor : "rgba(220,220,220,1)",
			data: oldIFScore
		 },
		 ]
  }
  var LogTone = {
labels : Tone,
		 datasets : [
		 {
fillColor : "rgba(220,220,220,1)",
			strokeColor : "rgba(220,220,220,1)",
			data: oldToneScore
		 },
		 ]
  }
  */
/*
  var BarIF = new Chart(document.getElementById("canvas_IF").getContext("2d")).Bar(barChartDataIF);          	
  var Bartone = new Chart(document.getElementById("canvas_Tone").getContext("2d")).Bar(barChartDataTone);          	
  var LineIF = new Chart(document.getElementById("canvas_IF_line").getContext("2d")).Line(lineChartDataIF);          	
  var LineTone = new Chart(document.getElementById("canvas_Tone_line").getContext("2d")).Line(lineChartDataTone);          	
  var BarLogIF = new Chart(document.getElementById("canvas_IF_log").getContext("2d")).Bar(LogIF);          	
  var BarLogTone = new Chart(document.getElementById("canvas_Tone_log").getContext("2d")).Bar(LogTone);          	
*/
}


/*  for audio w/ data transfer  */
function sendWaveInBlobToServer(blob, url) {

  var fileReader = new FileReader();
  fileReader.onload = function (event) {
  var base64data = event.target.result;
  //console.log("base64: "+base64data);
  //var snd = new Audio(base64data);
  //snd.play();

	$.ajax({
url: url + '/sentAudio',
data: {data: base64data,},
type: 'POST',
success: onSuccessReturnScoreAndSentece,
error: function(xhr, textStatus, errorThrown){
	alert(errorThrown);
//$.ajax(this);	//retry	  
	return;
}
});
  $("#selectionBox").empty();
  $('#selectionBox').append('<div id="loading-image" style="vertical-align:middle"><img src="img/loading_circle.gif"/></div>');
  $("#totalScore").empty();
  $("#pronunScore").empty();
  $("#toneScore").empty();
  $("#timingScore").empty();
  $("#emphasisScore").empty();
  $('#scoreDetail').empty();
  $('#sendaudio').prop('disabled', true);
  $('#record').prop('disabled', true);
  $('#play').prop('disabled', true);
  document.getElementById("showSentences").style.display="none";
}
fileReader.readAsDataURL(blob);
}

// for jQuery test
$('#date').datepicker();
$('a[data-toggle=tooltip]').mouseover(function() { 
	console.log('got you!');
	$(this).tooltip('show'); 
	});


function showCandidate(){
	$("#selectionBox").show();
	$("#showSentences").hide();
    $("#dialogueContentSection").children("div:last").show();
    $('#dialogueContentSection').scrollTop(9999999);
    $("#dialogueContentSection").children("audio:last").show();
    $("#dialogueContentSection").children("audio:last").attr("src",this.id).get(0).play();
    $('#sendaudio').prop('disabled', false);
    $('#record').prop('disabled', false);
    $('#play').prop('disabled', false);
}

function onSuccessReturnScoreAndSentece(res) {
  var scores = res.return_score.split('\n');
  scores.splice(scores.length-1,1);
  var detect = scores.slice(0);
  var detect2 = detect[0].split(' ');
  if(detect2[0].indexOf("Analyze") != -1){  //analyze failed
	 alert('Unable to analyze the audio file, please record and send again.');
	 $('#selectionBox').empty();
	 $('#selectionBox').append(BUSC);
     $('#sendaudio').prop('disabled', false);
     $('#record').prop('disabled', false);
     $('#play').prop('disabled', false);
     $("#dialogueContentSection").children("div:last").fadeOut();
     $("#dialogueContentSection").children("audio:last").remove();
     $('.accordion-heading').on('click',function(){
	   selectionFlag = $(this).attr('value');
     });
  }
  else{
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
	$("#showSentences").show();
    $("#selectionBox").empty();
	//seperate score
	var separateScore = new Array(scores.length-1);
	for (var i=1;i<scores.length;i++){
	  separateScore[i-1] = scores[i].split(',');	
	}

	altered = Math.floor(humanSentenceSelectionID/100)-1;
	temp = parseInt(demo2experimentMapping[humanSentenceSelectionID])+altered;
	humanExperimentIndex = temp.toString();
	var d = dialogueTreeLineIF[humanExperimentIndex];

	// detail score
	$('#scoreDetail').empty();
	var tableContent = '<table class="table table-striped" width="20">';
	var pRc=0;
	for (var i=0;i<6;i++){
	  tableContent +='<tr>';
	  if(i==0){
		tableContent += '<td></td>';
		for (var j=0;j<separateScore.length;j++){
		  tableContent += '<td><font size="3">';
		  tableContent += separateScore[j][0];
		  tableContent += '</font></td>';
		}
	  }
	  else if(i==1){
		tableContent += '<td><font size="3">Initial</font></td>';
		for (var j=0;j<separateScore.length;j++){
		  tableContent += '<td>';
		  if(d[2*j]=='j' || d[2*j]=='ch' || d[2*j]=='sh' || d[2*j]=='r')
			tableContent += '<span class="label label-fixed-danger">';
		  else
			tableContent += '<span class="label label-fixed">';
		  tableContent += d[2*j]+'</span><font size="3">';
	      if(document.getElementById('poorRetroflex').checked &&
		   ( d[2*j]=='j' || d[2*j]=='ch' || d[2*j]=='sh' || d[2*j]=='r')){
		      separateScore[j][1]=pR[pRc];
			  pRc++;
		  }
		  tableContent += separateScore[j][1];
		  tableContent += '</font></td>';
		}
	  }
	  else if(i==2){
		tableContent += '<td><font size="3">Final</font></td>';
		for (var j=0;j<separateScore.length;j++){
		  tableContent += '<td>';
		  tableContent += '<span class="label label-fixed">'+d[2*j+1]+'</span><font size="3">';
		  tableContent += separateScore[j][i-(6-separateScore[j].length)];
		  tableContent += '</font></td>';
		}		
	  }
	  else{
		if(i==3)
		  tableContent += '<td><font size="3">Tone</font></td>';
		if(i==4)
		  tableContent += '<td><font size="3">Timing</font></td>';
		if(i==5)
		  tableContent += '<td><font size="3">Emphasis</font></td>';
		for (var j=0;j<separateScore.length;j++){
		  tableContent += '<td><font size="3">';
		  tableContent += separateScore[j][i-(6-separateScore[j].length)];
		  tableContent += '</font></td>';
		}		
	  }
	  tableContent += '</tr>';
	}
	tableContent += "</table>";
	$('#scoreDetail').append(tableContent);

	/*for (i=1;i<scores.length;i++) {
	  $('<tr><td><tag data-toggle="popover" title="Score" data-content='+scores[i]+'>'+scores[i]+'</a></td></tr>').appendTo("#scoreDetail");
	  }*/

	$("#return_score").val(res.return_score);
	getDialogueContent();
	}
}

function sendAudio() {
  if(audioRecorder!=null){
  audioRecorder.exportWAV( doneEncoding );
  // could get mono instead by saying audioRecorder.exportMonoWAV( doneEncoding );
  }
  else{
     alert('Please turn on your microphone!');	
  }
}

function drawWave( buffers ) {

  var canvas = document.getElementById( "wavedisplay" );
  //drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );
}

function doneEncoding( blob ) {
  sendWaveInBlobToServer(blob, SERVER_IP);
}

function playSample( e ){
  var index = humanSentenceChoice[selectionFlag];
  if(index!=undefined){
	$("audio[id=BoxAudio"+index+"]").attr("src",this.id).get(0).play();
	/*
	   if(e.classList.contains("playing")){
	//stop playing
	$("audio[id=BoxAudio"+index+"]").attr("src",this.id).get(0).pause();
	$("audio[id=BoxAudio"+index+"]").attr("src",this.id).get(0).currentTime=0;
	e.classList.remove("playing");
	$('#playsample').empty();
	$('#playsample').append('<a onclick='+'"playSample(this)"'+'>Play Sample</a>');
	}
	else{
	//start playing
	e.classList.add("playing");
	$('#playsample').empty();
	$('#playsample').append('<a onclick='+'"playSample(this)"'+'>Stop Sample</a>');
	$("audio[id=BoxAudio"+index+"]").attr("src",this.id).get(0).play();
	}
	$("audio[id=BoxAudio"+index+"]").attr("src",this.id).bind('ended',function(){
	e.classList.remove("playing");
	$('#playsample').empty();
	$('#playsample').append('<a onclick='+'"playSample(this)"'+'>Play Sample</a>');
	});
	 */
  }
}

function playRecord( e ){  audioRecorder.exportWAV( playRecord1 ); }
function playRecord1(blob){  playRecord2(blob, SERVER_IP); }
function playRecord2(blob, url) {
  var fileReader = new FileReader();
  fileReader.onload = function (event) {
	var base64data = event.target.result;
	console.log("base64: "+base64data);
	var snd = new Audio(base64data);
	snd.play();
  }	
  fileReader.readAsDataURL(blob);
}

function toggleRecording( e ) {
  if(audioRecorder!=null){
	if (e.classList.contains("recording")) {
	  // stop recording
	  audioRecorder.stop();
	  e.classList.remove("recording");
	  $('#record').empty();
	  $('#record').append('Record');
	  audioRecorder.getBuffers(drawWave );
	} else {
	  // start recording
	  if (!audioRecorder)
		return;

	  e.classList.add("recording");
	  audioRecorder.clear();
	  $('#record').empty();
	  $('#record').append('Stop');
	  audioRecorder.record();
	}
  }
  else{
    alert('Please turn on your microphone!');	
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
  //updateAnalysers();
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
var selectedUnitType = '1';
var userName = "Eddy";

var userCurrentSelectionID = [];

var humanSentenceSelection = [];
var humanSentenceChoice = [];
var humanSentenceSelectionID = '000';


$("#dialogueContent").hide();

function onclickStart(){
  // Reset course and unitType selection
  selectedCourseArray = [];
  selectedUnitType = '0';

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
	"userUnitScores":userPerformance['userUnitScores'],
	"timeStamp":Date.now()
  
  }
  $.ajax({
url: SERVER_IP + '/updateHumanSelection',
type: "GET",
data: sendData,
success: onSuccess,
//error: function(xhr, textStatus, errorThrown){
//$.ajax(this);	//retry	  
//	return;
//}
});
}

function getDialogueContent() {
  $.ajax({
url: SERVER_IP + '/dialogueContent',
type: "GET",
success: onSuccess,
//error: onError,
});
}


function imagePlay(index){
  //$("#sentenceAudio:last").attr("src",this.id).get(0).play();
  $("audio[id=sentenceAudio"+index+"]").attr("src",this.id).get(0).play();
}


function onSuccess(res) {
  // clear user selectionBox choices
  $("#selectionBox").empty();

  humanSentenceSelection = res.Human;
  humanSenteceTranslation = res.english;
  humanSentenceChoice = res.HumanSentenceID;

  if(res.Computer[0].length==2){
    $("<div class='bubbledLeft playMedia' onclick='imagePlay("+res.dialogueIndex[0]+")'>"+ res.Computer[0][1]+ "</div><audio id='sentenceAudio" +res.dialogueIndex[0] +"' src='dialogueTree_wav/" + res.dialogueIndex[0] + ".wav' > </audio>").appendTo("#dialogueContentSection");
	$("<div class='bubbledLeft playMedia' onclick='imagePlay("+res.dialogueIndex[1]+")'>"+ res.Computer[1][1]+ "</div><audio id='sentenceAudio" +res.dialogueIndex[1] +"' src='dialogueTree_wav/" + res.dialogueIndex[1] + ".wav' autoplay> </audio>").appendTo("#dialogueContentSection");
  }
  else{
 	$("<div class='bubbledLeft playMedia' onclick='imagePlay("+res.dialogueIndex+")' style='display:none'>"+ res.Computer[1]+ "</div><audio id='sentenceAudio" +res.dialogueIndex +"' src='dialogueTree_wav/" + res.dialogueIndex + ".wav'> </audio>").appendTo("#dialogueContentSection");
		console.log('dialogueTree_wav/' + res.dialogueIndex +'.wav');
	}
  //	$("<div class='bubbledLeft'>"+ res.Computer[1]+ "</div><audio id='sentenceAudio' src='dialogueTree_wav/" + res.dialogueIndex + "'.wav autoplay> </audio>").appendTo("#dialogueContentSection");
  //	$("<div class='bubbledLeft'><span class='playMedia' src='img/save.svg' onclick='imagePlay()'>"+ res.Computer[1]+ "</span></div><audio id='sentenceAudio' src='dialogueTree_wav/" + res.dialogueIndex + "'.wav autoplay> </audio>").appendTo("#dialogueContentSection");
  //$("<div class='bubbledLeft playMedia' onclick='imagePlay()'>"+ res.Computer[1]+ "</div><audio id='sentenceAudio' src='dialogueTree_wav/" + res.dialogueIndex + ".wav' autoplay> </audio>").appendTo("#dialogueContentSection");
  if(res.recommendedIndex=='end'){
	$('#selectionBox').empty();
  }
  else{
	if(selectionFlag==-1){  //at the beginning of the game
	  $("#selectionBox").show();
      $("#dialogueContentSection").children("div:last").show();
      $("#dialogueContentSection").children("audio:last").show();
      $("#dialogueContentSection").children("audio:last").attr("src",this.id).get(0).play();
      $('#sendaudio').prop('disabled', false);
      $('#record').prop('disabled', false);
      $('#play').prop('disabled', false);
	}
	else{
	  $("#selectionBox").hide();
	}
	var min = 0;
	var max = res.Human.length - 1;
	flag = Math.floor(Math.random() * (max - min + 1)) + min;
	var selectionBoxContent=["",""];
	var isRec=1;	//is recommended
    selectionBoxContent[0] +='<div class="accordion" id="accd">';
	for (var i=0;i<res.Human.length;i++){
	  if (res.HumanSentenceID[i] == res.recommendedIndex){
		isRec=0;
	    selectionFlag = i;
		//selectionBoxContent[isRec] += '<img src="img/nostar.png" width="45" height="30" align="left">';
	  }
	  else{
		isRec=1;
		//selectionBoxContent[isRec] += '<img src="img/nostar.png" width="45" height="30" align="left">';
	  }
	  selectionBoxContent[isRec] +='<div class="accordion-group">';
	  selectionBoxContent[isRec] +='<div class="accordion-heading" value="'+i+'">';
	  selectionBoxContent[isRec] +='<a class="accordion-toggle" data-toggle="collapse" data-parent="#accd" href="#c' +i+'">';
	  if (res.HumanSentenceID[i] == res.recommendedIndex)
		selectionBoxContent[isRec] +='<font color="#48CCCD">※ ';
	  else	
		selectionBoxContent[isRec] +='<font color="#000000">';
	  selectionBoxContent[isRec] += res.Human[i][1];	
	  if(res.english[i]!=null)
	    selectionBoxContent[isRec] += "( " +res.english[i][1]+ " )";
	  selectionBoxContent[isRec] +='</font>';	
	  selectionBoxContent[isRec] +='</a>';
	  selectionBoxContent[isRec] +='</div>';  //end for <accordion-heading>
	  if (res.HumanSentenceID[i] == res.recommendedIndex){
		isRec=0;
	    selectionBoxContent[isRec] +='<div id="c'+i+'" class="accordion-body collapse in"><div class="accordion-inner">';
		selectionBoxContent[isRec] +=
		  "<label class='btn btn-block btn-info'><input class='sentenceSelect' type='radio' name='CourseID' value="+i+" style='display:none' checked";
		if(res.Human.length==1)  //only one sentence to select
		  selectionBoxContent[isRec] += " disabled";  
		selectionBoxContent[isRec] += ">"; 
	  }
	  else{
		isRec=1;
	    selectionBoxContent[isRec] +='<div id="c'+i+'" class="accordion-body collapse"><div class="accordion-inner">';
		selectionBoxContent[isRec] += "<label class='btn btn-block btn-default'><input class='sentenceSelect' type='radio' name='CourseID' value="+i+" style='display:none'>";
	  }
	  selectionBoxContent[isRec] +='<audio id="BoxAudio' + res.HumanSentenceID[i]+ '" src = "dialogueTree_wav/' + res.HumanSentenceID[i] + '.wav"></audio>';
	  altered = Math.floor(humanSentenceChoice[i]/100)-1;
	  temp = parseInt(demo2experimentMapping[humanSentenceChoice[i]])+altered;
	  displayIndex = temp.toString();
	  var d = IF_punc[displayIndex], x = Tone_punc[displayIndex];
	  //selectionBoxContent += '<br></br>';
	  selectionBoxContent[isRec] += '<table border="0" align="center"><tr>';
	  for(var j=-1;j<res.Human[i][1].length;j++){
		if(j!=-1)
		  selectionBoxContent[isRec] += '<td><font size="5">' + res.Human[i][1][j] + '</font></td>';
	    else
		  selectionBoxContent[isRec] += '<td></td>';
	  }
	  selectionBoxContent[isRec] += '</tr><tr>';
	  for(var j=-2;j<d.length-1;j+=2){
		if(j==-2)
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-danger">Initial';
		//highlight the retroflex consonants
		else if(d[j]=="j" || d[j]=="ch" || d[j]=="sh" || d[j]=="r")
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-danger">' + d[j];
		else if(d[j].charCodeAt(0)>=65 && d[j].charCodeAt(0)<=122)
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed">'+d[j];
		else
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-transparent">'+'_';
		selectionBoxContent[isRec] += '</span></td>';  
	  }
	  selectionBoxContent[isRec] += '</tr><tr>';
	  for(var j=-1;j<d.length;j+=2){
		if(j==-1)
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-danger">Final';
		else if(d[j].charCodeAt(0)>=65 && d[j].charCodeAt(0)<=122)
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed">'+d[j];
		else
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-transparent">'+'_';
		selectionBoxContent[isRec] += '</span></td>';  
	  }
	  selectionBoxContent[isRec] += '</tr><tr>';
	  for(var j=-1;j<x.length;j++){
		if(j==-1)
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-danger">Tone';
		else if(x[j].charCodeAt(0)>=48 && x[j].charCodeAt(0)<=57)
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed">'+x[j];
		else
		  selectionBoxContent[isRec] += '<td><span class="label label-fixed-transparent">'+'_';
		selectionBoxContent[isRec] += '</span></td>';  
	  }
	  selectionBoxContent[isRec] += '</tr></table>';
	  if(res.english[i]!=null)
		selectionBoxContent[isRec] += "<font size='5'>( " +res.english[i][1]+ " )</font>";
	  selectionBoxContent[isRec] += "</label>";
	  selectionBoxContent[isRec] +='</div></div>'; //end for accordion-inner
	  selectionBoxContent[isRec] +='</div>'; //end for accordion-group
	}
  }
  selectionBoxContent[1] +='</div>'; //end for <div id="accd">
  var selectionBoxContentFull = selectionBoxContent[0] + selectionBoxContent[1];
  //back up the sentences
  BUSC= selectionBoxContentFull.slice();
  selectionBoxContent[1] +='</div>'; //end for <div id="accd">
  $('#selectionBox').append(selectionBoxContentFull);
  console.log(JSON.stringify(res.Human[0][1]));
  //set the frame scroll to bottom
  $('#dialogueContentSection').scrollTop(9999999);
  //when the accordion is shown, set the flag to its value
  $('.accordion-heading').on('click',function(){
	selectionFlag = $(this).attr('value');
  });
}

function confirmUserSelection() {
  //selectionFlag = $(".sentenceSelect:checked").val();
  if(typeof(selectionFlag)=="undefined"){
	alert("Please select one sentence to practice!");
  }
  $("<div class='bubbledRight playMedia' onclick='imagePlay("+humanSentenceChoice[selectionFlag] +")'>"+ humanSentenceSelection[selectionFlag][1]+ "</div><audio id='sentenceAudio" + humanSentenceChoice[selectionFlag] +"' src='dialogueTree_wav/" + humanSentenceChoice[selectionFlag] + ".wav'> </audio>").appendTo("#dialogueContentSection");
  //$("<div class='bubbledRight'>"+ humanSentenceSelection[selectionFlag][1] + "</div>").appendTo("#dialogueContentSection")alogu;
  humanSentenceSelectionID = humanSentenceChoice[selectionFlag];
  console.log('confirm user sentence selection: ', humanSentenceSelectionID);
  updateHumanSelection();
  //set the frame scroll to bottom
  $('#dialogueContentSection').scrollTop(9999999);
}

function calCount(str,turnStart,turn){
  var sum=0;
  //for(var i=1;i<=turn;i++){
  for(var i=turnStart;i<=turn;i++){
	sum+=parseInt(str[i]);
  }
  return sum;
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) 
	if ((new Date().getTime() - start) > milliseconds)
	  break;

}
