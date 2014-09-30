var http = require('http'), 
	url = require('url'),
	fs = require('fs');

var exec = function (cmd, callback) {
  console.log('Executing shell command : "%s"...', cmd);
  require('child_process').exec(cmd, callback);
}

const LISTENING_PORT = 8015;

var response;

var userTime = new Date();
var userInfo;
var selectedCourseID = [];
var selectedUnitTypeID = '0'; // determine policyFlag, 0 for all units, 1 for retroflex units
var currentCourseID;
var currentDialogueIndex;
var recommendedDemoIndex;
var humanSentenceSelectionIndex = '000';
var currentTime=0;
var userUnitScores = [];
for (var i=0;i<101;i++) {
  userUnitScores.push('101.0');
}

/*  start of dialogue tree dict setup  */
var dialogueTreeLink = {};
var dialogueMapToContent = {};
var dialogueTranslation = {};

fs.readFile('dialogueTreeFile/tree_new_for_demo_utf8', 'utf8', function (err,data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length;i++) {
	var tmpArray = dialogueFile[i].split(' ');
	dialogueMapToContent[tmpArray[0]] = [tmpArray[1],tmpArray[2]];
	dialogueTreeLink[tmpArray[0]] = tmpArray.slice(3,tmpArray.length-1);
	};
	});
/* insert english translation */
fs.readFile('dialogueTreeFile/tree3_4_5_english', 'utf8', function (err,data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length;i++) {
	var tmpArray = dialogueFile[i].split(' ');
	var tmpContent = tmpArray.splice(0,2);
	dialogueTranslation[tmpContent[0]] = [tmpContent[1],tmpArray.join(' ')];
	};
	});
/*  end of dialogue tree dict setup  */

/*  start of char 'b' dialogue index to turn mapping  */
var charBIndex2TurnMapping = {};
var charBTurn2IndexMapping = {};

fs.readFile('algorithms/corpus/cycle_tree/10-cycle_tree.b.turnIndex', 'utf8', function (err,data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {  // i don't know why it should be dialogueFile.length-1, not dialogueFile.length
	var tmpArray = dialogueFile[i].split('\t');
	charBIndex2TurnMapping[tmpArray[0]] = tmpArray[1];
	charBTurn2IndexMapping[tmpArray[1]] = tmpArray[0];
	};
	});

/*  end of char 'b' dialogue index to turn mapping  */

/*  start of dialogue demo index to experiment index  */
var demo2experimentMapping = {};
var experiment2demoMapping = {};

fs.readFile('algorithms/corpus/cycle_tree/demo_experiment_index_mapping', 'utf8', function (err,data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {  // i don't know why it should be dialogueFile.length-1, not dialogueFile.length
	var tmpArray = dialogueFile[i].split('\t');
	demo2experimentMapping[tmpArray[0]] = tmpArray[1];
	experiment2demoMapping[tmpArray[1]] = tmpArray[0];
	};
	});
/*  end of dialogue demo index to experiment index  */

/*  start of each dialogue index maps to previous candidates  */
var dialogueInvertedIndex = {};

fs.readFile('algorithms/corpus/cycle_tree/dialogueInvertedIndex', 'utf8', function (err,data) {
	var dialogueFile = data.split('\n');
	for (var i=0;i<dialogueFile.length-1;i++) {  // i don't know why it should be dialogueFile.length-1, not dialogueFile.length
	var tmpArray = dialogueFile[i].split('\t');
	dialogueInvertedIndex[tmpArray[0]] = tmpArray[1].split(' ');
	};
	});
/*  end of each dialogue index maps to previous candidates  */


// create server
var express = require("express"); 
var app = express();
app.listen(LISTENING_PORT);
app.use(express.bodyParser()); // for POST method

app.post('/info', function(req, res){
	console.log('POST INFO');

	selectedCourseID = req.body.selectedCourseID;
	selectedUnitTypeID = req.body.selectedUnitTypeID;
//	userInfo = req.body.userName+"_"+(userTime.getMonth()+1)+"-"+userTime.getDate()+'-'+userTime.getFullYear()+'_'+ userTime.getHours()+'-'+userTime.getMinutes()+'-'+userTime.getSeconds();
	userInfo = req.body.userName+"_"+(userTime.getMonth()+1)+"-"+userTime.getDate()+'-'+userTime.getFullYear();
	humanSentenceSelectionIndex = '000';

	currentCourseID = selectedCourseID.shift(); // extract the first selected dialogue tree index
	currentDialogueIndex = currentCourseID + '01';

	console.log(currentDialogueIndex);

	res.writeHead(200, HTTP_HEADER);
	res.write("ok");
	res.end();

});


app.get('/updateHumanSelection', function(req,res){
	console.log('GET UPDATEHUMANSELECTION');

	var query = req.query;

	/* start of original code */
	//	humanSentenceSelectionIndex = query["humanSentenceSelectionID"];
	//	userUnitScores = query["userUnitScores"];
	//	console.log("updateHumanSelection: " + humanSentenceSelectionIndex);
	/* end of original code */

	// to prevent current index chaos
	var checkIndex = query["humanSentenceSelectionID"];
	var timeStamp = query["timeStamp"];
	console.log('new query Index:'+checkIndex);
	console.log('current Index:'+humanSentenceSelectionIndex);
	console.log('time stamp:'+query["timeStamp"]);
	console.log('currentTime'+currentTime);
	//if (parseInt(checkIndex) >= parseInt(humanSentenceSelectionIndex)
	//  && query["userUnitScores"].length==101) {
	if(timeStamp>currentTime && checkIndex!='000'){
	  currentTime = timeStamp;
	  humanSentenceSelectionIndex = query["humanSentenceSelectionID"];
	  userUnitScores = query["userUnitScores"];
	  console.log("updateHumanSelection: " + humanSentenceSelectionIndex);
	}
	else{

	  console.log("length="+query["userUnitScores"].length);
	}

	res.writeHead(200, HTTP_HEADER);
	res.write("ok");
	res.end();
});

app.get('/dialogueContent', function(req, res){
	console.log('GET DIALOGUE CONTENT');

	res.writeBack = writeBack;
	response = res;

	if (humanSentenceSelectionIndex == '000') {
	currentDialogueIndex = currentCourseID + '01';
	recommendedDemoIndex = currentCourseID + '02';

	// return JSON file
	var returnData = {};
	returnData['Computer'] = dialogueMapToContent[currentDialogueIndex],
	returnData['Human'] = [];
	returnData['english']=[];
	returnData['HumanSentenceID'] = [];

	for (var i=0;i<dialogueTreeLink[currentDialogueIndex].length;i++){
	var tmpID = dialogueTreeLink[currentDialogueIndex][i]
	var tmpContent = dialogueMapToContent[ dialogueTreeLink[currentDialogueIndex][i] ];
	var englishTrans = dialogueTranslation[ tmpID ];
	returnData['Human'].push(tmpContent);
	returnData['english'].push(englishTrans);
	returnData['HumanSentenceID'].push(tmpID);
	}
	returnData['dialogueIndex'] = currentDialogueIndex;
	returnData['recommendedIndex'] = recommendedDemoIndex;

	// console.log(returnData);
	//res.writeBack(JSON.stringify(returnData));
	res.writeHead(200, HTTP_HEADER);
	res.write(JSON.stringify(returnData));
	res.end();
	
	}
	else {
	  // console.log('hey im good'+humanSentenceSelectionIndex);
	  var experimentIndex = demo2experimentMapping[humanSentenceSelectionIndex];
	  var experimentTurnIndex = charBIndex2TurnMapping[experimentIndex];

	  // console.log('haha',experimentIndex);
	  // console.log('hoho',experimentTurnIndex);

	  var LLMDPcmd = 'python algorithms/LLMDP/turn2SelectNextIndex.py ' + experimentTurnIndex + ' '+ userUnitScores.toString() + ' ' + selectedUnitTypeID;

	  exec(LLMDPcmd,cmdEnd);

	  //		execSync(LLMDPcmd);
	  //		cmdEnd(res);
	}
});

function cmdEnd(err, stdout, stderr) {
  var recommendedExperimentIndex = stdout.split('\n')[0];

  recommendedDemoIndex = experiment2demoMapping[recommendedExperimentIndex];

  console.log('recommended_experiment '+recommendedExperimentIndex);
  console.log('recommended_demo '+recommendedDemoIndex);

  var min = 0;
  var max = dialogueInvertedIndex[recommendedExperimentIndex].length - 1;
  flag = Math.floor(Math.random() * (max - min + 1)) + min;
  // console.log('flag'+flag);

  var currentExperimentDialogueIndex = dialogueInvertedIndex[recommendedExperimentIndex][flag];

  console.log('currentExperimentIndex '+currentExperimentDialogueIndex);
  currentDialogueIndex = experiment2demoMapping[currentExperimentDialogueIndex];

  console.log('currentDialogueIndex '+currentDialogueIndex);

  // return JSON file
  var returnData = {};
  returnData['Computer'] = dialogueMapToContent[currentDialogueIndex],
	returnData['Human'] = [];
  returnData['HumanSentenceID'] = [];
  returnData['english']=[];

  var judgeFlag = dialogueTreeLink[currentDialogueIndex][0];
  var oldIndex = currentDialogueIndex;
  if(judgeFlag.charAt(1)=='0' && judgeFlag.charAt(2)=='1'){	//tree end
	console.log(currentDialogueIndex);
	if(selectedCourseID.length>=1){	//we haven't gone thru all the trees
	  currentCourseID = selectedCourseID.shift(); // extract the next selected dialogue tree index
	  //set current index to new tree's top
	 currentDialogueIndex = currentCourseID + '01';
	 returnData['Computer']=[];
	 returnData['Computer'].push(dialogueMapToContent[oldIndex]),
	 returnData['Computer'].push(dialogueMapToContent[currentDialogueIndex]),
	 returnData['dialogueIndex'] = currentDialogueIndex;
	}
	else{
	  returnData['dialogueIndex'] = currentDialogueIndex;
	  returnData['recommendedIndex'] = 'end';
    }
  }
  if(selectedCourseID.length>=0 && returnData['recommendedIndex']!='end'){
	for (var i=0;i<dialogueTreeLink[currentDialogueIndex].length;i++){
	  var tmpID = dialogueTreeLink[currentDialogueIndex][i]
		var tmpContent = dialogueMapToContent[ dialogueTreeLink[currentDialogueIndex][i] ];
	  returnData['Human'].push(tmpContent);
	  returnData['HumanSentenceID'].push(tmpID);
	  var englishTrans = dialogueTranslation[ tmpID ];
	  returnData['english'].push(englishTrans);
	}
	returnData['dialogueIndex'] = currentDialogueIndex;
	returnData['recommendedIndex'] = recommendedDemoIndex;
	if(judgeFlag.charAt(1)=='0' && judgeFlag.charAt(2)=='1'){	//tree end
	  returnData['dialogueIndex']=[];
	  returnData['dialogueIndex'].push(oldIndex);
	  returnData['dialogueIndex'].push(currentDialogueIndex);
	}
  }
  console.log(returnData);
  //response.writeBack(JSON.stringify(returnData));
  response.writeHead(200, HTTP_HEADER);
  response.write(JSON.stringify(returnData));
  response.end();
}


app.post('/sentAudio', function(req, res) { 
	console.log('POST SENT AUDIO');

	res.writeBack = writeBack;
	response = res;
	var base64data = req.body.data.replace(/^data:audio\/wav;base64,/,"");
	var saveFileName = 'user_wav/' + userInfo + '_'+ userTime.getHours()+'-'+userTime.getMinutes()+'-'+userTime.getSeconds() + '_' + humanSentenceSelectionIndex + '.wav'

	console.log('saveFileName: ', saveFileName);
	fwrite64(saveFileName, base64data);
	});

function fwrite64(filename, base64data) {
  fs.writeFile(filename, base64data, 'base64', function(err) {
	  if (err) {
	  console.log(err)
	  return;
	  }
	  console.log("The file was saved as \"" + filename + "\"!");
	  exec("python go.py "+humanSentenceSelectionIndex + ' ' + filename, onSuccess);
	  }); 
}

function onSuccess(err, stdout, stderr) {
  var ack = {return_score: stdout};
  console.log(ack);
  response.writeHead(200, HTTP_HEADER);
  response.write(JSON.stringify(ack));
  response.end();
  //response.writeBack(JSON.stringify(ack));
}

const HTTP_HEADER = {
    'content-type': 'application/json',
    'Access-Control-Allow-Origin': '*'
};

function writeBack(data) {
  this.set({
	  'content-type': 'application/json',
	  'Access-Control-Allow-Origin': '*'
	  })
  this.send(data);
  console.log('Waiting for new request...');
}

console.log('Server is now running...');
