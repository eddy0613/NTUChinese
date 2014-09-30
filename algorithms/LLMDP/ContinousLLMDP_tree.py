# LLMDP.py

from sets import Set
import random
import sys
import mdp
import environment
import util
import optparse
import math
import heapq 

import networkx as nx
#from dialog_experiment import *
from Action import *
import State
import user

unitNumFocused = 101
unitIndexNotUsed = []

class LLMDP(mdp.MarkovDecisionProcess):
	"""
	NTUChinese
	"""
	def __init__(self, dialog, dialogInformation):
		self.dialog = dialog
		self.dialogInformation = dialogInformation
		
		# for different cases of choosing action
		self.case = 0 # case = 0: simulated case (recursive)
						 # case = 1: practical case (jump dialogue trees..)
		# parameters
		self.livingReward = 0.0
		self.noise = 0.0
    #	self.endIndex = 0

	#def setEndIndex(self,index)
	#	self.endIndex = index

	def setLivingReward(self, reward):
		"""
		The (negative) reward for exiting "normal" states.
 
		Note that in the R+N text, this reward is on entering
		a state and therefore is not clearly part of the state's
		uture rewards.
		"""
		self.livingReward = reward
        
	def setNoise(self, noise):
		"""
		The probability of moving in an unintended direction.
		"""
		self.noise = noise

	def setCase(self, case):
		self.case = case

	def getPossibleActions(self, state):
		"""
		Returns list of valid actions for 'state'.
    
		Note that you can request moves into walls and
		that "exit" states transition to the terminal
		state under the special action "done".
		"""
		"""
		if state.dialogTurnIndex == util.returnConvertedIndexListCount('b','cycle_tree'):
			return () # return () enables agent to make sure episode ends
		#if state.dialogTurnIndex == self.endIndex:
		#	return ()
		else:
			return tuple( util.turnIndex2action('b','cycle_tree',state.dialogTurnIndex) )
		"""
		if self.case == 0:
			return tuple( util.turnIndex2action('b','cycle_tree',state.dialogTurnIndex) )
		elif self.case == 1:
			treeEnds = [11,23,35,47,53,63,73,79,83]
			if state.dialogTurnIndex in treeEnds:
				randomStateDialogTurnIndex = treeEnds[random.randint(0,len(treeEnds)-1)]
				return tuple( util.turnIndex2action('b','cycle_tree',randomStateDialogTurnIndex) )
			else:
				return tuple( util.turnIndex2action('b','cycle_tree',state.dialogTurnIndex) )
   
	def getStates(self):
		"""
		Return list of all states.
		In continuous state case, this is to get all turns.
		"""
		totalConvertedIndexNum = util.returnConvertedIndexListCount('b','cycle_tree') - 1 ## minus 1 for terminal
		turns = []
		for i in range(0,totalConvertedIndexNum):
			turns.append(i)
		return turns
        
	def getReward(self, state, action, nextState, userData):
		"""
		Get reward for state, action, nextState transition.
	
		Note that the reward depends only on the state being
		departed (as in the R+N book examples, which more or
		less use this convention).
		"""
		#totalAverage = userData._phoneAverage+userData._toneAverage
		#if min(totalAverage) < 75.0:
			#print -1
		#	return -0.01, 0.0, 1.0 # Last one is for turn count
		#else:
#		print 'user',userData.qualifiedUnitPercentage * 82.0
		if userData.qualifiedUnitPercentage >= 0.95:
			return 0.0, 0.0, 0.0
		else:
			return -0.01, 0.0, 1.0
		"""
		#if state.dialogIndex == 161 or state.dialogIndex == 162 or state.dialogIndex == 163:
		if state.dialogTurnIndex == util.returnConvertedIndexListCount('b','cycle_tree') - 1:
			totalAverage = userData._phoneAverage+userData._toneAverage
			totalLex = userData.totalIF + userData.totalTone
			print
			for i in totalLex:
				print i,
			print 
			for i in totalAverage:
				print i,
			print 

			saidIF = 0
			badReward = 0.0
			badLexNum = 0
			randomIFandTone = util.random_B_IFandTonecount_tree()
			max1 = util.max_B_IFandTonecount_tree()
			min1 = util.min_B_IFandTonecount_tree()
			for i in range(0,len(totalAverage)):
				#if totalAverage[i] != 0.0 and totalAverage[i] < 99:
				if totalAverage[i] < 100.0:
					saidIF += 1
					if totalAverage[i] < 80:
						normoalizeScore = 0.01 * totalAverage[i]
						badReward += (float(totalLex[i] - randomIFandTone[i]) / \
									  float(randomIFandTone[i])) * math.pow((0.8-normoalizeScore)/0.8,1)
						badLexNum += 1
	
			AOP = (float(badReward)/float(badLexNum)) * 100.0
			explore = (float(saidIF)/82.0) * 100.0
			#print AOP
			#print saidIF, explore
			reward = float(sys.argv[1])*AOP + float(sys.argv[2])*explore
			# return values in percentage 
			print  reward, AOP, explore
			return reward, AOP, explore
		else:
			return 0.0, 0.0, 0.0
		"""
	def getStartState(self):
		if self.case == 0:
			return State.State()
		elif self.case == 1: # random choose start state
			startStates = [0,12,24,36,48,54,64,74,80]
			return State.State(startStates[random.randint(0,len(startStates)-1)])
   
	def isTerminal(self, state):
		"""
		Only the TERMINAL_STATE state is *actually* a terminal state.
		The other "exit" states are technically non-terminals with
		a single action "exit" which leads to the true terminal state.
		This convention is to make the grids line up with the examples
		in the R+N textbook.
		"""
		#return state.dialogIndex == 161 or state.dialogIndex == 162 or state.dialogIndex == 163
		return state.dialogTurnIndex == util.returnConvertedIndexListCount('b','cycle_tree') - 1

	# not used in Q-learning
	def getTransitionStatesAndProbs(self, state, action):
		"""
		Returns list of (nextState, prob) pairs
		representing the states reachable
		from 'state' by taking 'action' along
		with their transition probabilities.          
		"""            
		if action not in self.getPossibleActions(state):
			raise "Illegal action!"
      
		if self.isTerminal(state):
			return []
                                                                      
		successors = [(0, 1.0)]
		return successors

class Environment(environment.Environment):

	def __init__(self, LLMDP, testFlag=0, foldN=0):
		self.ntu_chinese_world = LLMDP

		self.pi = user.readPiFile(foldN)
		self.mu = user.readMuFile(foldN)
		self.cov = user.readCovFile(foldN)
#		self.sent = user.readSentenceFile(foldN)

		self.reset(testFlag,foldN)
		self.testFlag = 0
		#self.fold = 0
		#self.ntu_chinese_world.setEndIndex(self.userInformation.endIndex)

	def getCurrentState(self):
		return self.state
        
	def getPossibleActions(self, state):        
		return self.ntu_chinese_world.getPossibleActions(state)

	def doAction(self, action):
		"""
		successorsList = []
		dialogIndex = self.userInformation._DialogIndex[-1]
		computerList = self.ntu_chinese_world.dialog[dialogIndex]
		for i in computerList:
			for j in self.ntu_chinese_world.dialog[i]:
				successorsList.append(j)
		successorsList = list(Set(successorsList))

		Total = len(successorsList)

		action = action % Total

		nextDialogState = successorsList[action]
		"""
		nextDialogState = action

#		print self.ntu_chinese_world.dialogInformation.node[nextDialogState]['content']	

		lineIF = self.ntu_chinese_world.dialogInformation.node[nextDialogState]['nodeIF']
		linetone = self.ntu_chinese_world.dialogInformation.node[nextDialogState]['nodeToneBoundary']
		linelex = lineIF + linetone


		simulatedScore = self.userGen.userSentenceGen(linelex, self.testFlag, self.fold)
		simulatedIFScore = simulatedScore[0:58]
		simulatedToneScore = simulatedScore[58:]

		self.userInformation.addScore(simulatedIFScore, lineIF, simulatedToneScore, linetone)
		self.userInformation.addDialogIndex(nextDialogState)

		# update user generated score
		qualifiedUnitPercentage = self.userInformation.qualifiedUnitPercentage
		phoneCount = self.userInformation.totalIF
		toneCount = self.userInformation.totalTone
		
		self.userGen.userGenScoreUpdate(phoneCount,toneCount,qualifiedUnitPercentage)

		combinedAverage = self.userInformation._phoneAverage+self.userInformation._toneAverage
		
		#WorstTones = heapq.nsmallest(fewNum, combinedAverage)
		#WorstToneIndex = combinedAverage.index(WorstTones[0])

		#level = levelOfStatus(self.userInformation._phoneAverage+self.userInformation._toneAverage)

		convertedDialogIndex = util.returnConvertedIndex('b',nextDialogState,'cycle_tree')
		#nextState = (convertedDialogIndex,level, WorstToneIndex)
		#nextState = (nextDialogState,) + tuple(simulatedScore)
		normalizedAverage = []
		for i in combinedAverage:
			normalizedAverage.append(float(i)/100.0)
		nextState = State.State(convertedDialogIndex, normalizedAverage)

		reward, AOP, explore= self.ntu_chinese_world.getReward(self.state, action, nextState, self.userInformation)
		self.state = nextState
		return (nextState, reward, AOP, explore)

	def reset(self,testFlag,foldN):

		self.state = self.ntu_chinese_world.getStartState()
		self.testFlag = testFlag
		self.fold = foldN

		#pi = user.readPiFile(testFlag, foldN)
		#mu = user.readMuFile(testFlag, foldN)
		#cov = user.readCovFile(testFlag, foldN)
		#self.userGen = user.userGen(pi,mu,cov)


		self.userGen = user.userGen(self.pi,self.mu,self.cov,testFlag)
		self.userGen.sampleCluster()

		self.userInformation = user.User('b')

def levelOfStatus(averageVector):
	badCnt = 0
	practiceCnt = 0
	for i in averageVector:
		if i < 101:
			practiceCnt += 1
			if i < 80:
				badCnt += 1 
	if practiceCnt == 0:
		return 0

	level = 0
	if float(badCnt)/ float(practiceCnt) > 0.66:
		level = 2
	elif float(badCnt)/ float(practiceCnt) > 0.33:
		level = 1
	else:
		level = 0
	return level

def getDialog(DialogFileName, IFFileName, ToneFileName):
	"""
	Open the dialog file and return DialogList
	"""
	#DialogFileName = '/home/eddy0613/dialogue_game/NTUChineseMDP/course_raw_smallmod'
	#IFFileName = '/home/eddy0613/dialogue_game/NTUChineseMDP/course_content_lineIF'
	#ToneFileName = '/home/eddy0613/dialogue_game/NTUChineseMDP/course_content_linetone'
	#print DialogFileName
	#print IFFileName
	#print ToneFileName
	DialogFile = open(DialogFileName,'r')
	IFFile = open(IFFileName,'r')
	ToneFile = open(ToneFileName,'r')
	
	DialogList = util.ReadFile(DialogFile)
	G = nx.DiGraph()
	G,Gdict = util.InstallGraph(DialogList)
	G = util.lineIF(G, IFFile)
	#G = util.lineTone(G,ToneFile)
	G = util.lineToneWithBoundary(G,ToneFile)

	return LLMDP(Gdict,G)

def printString(x): print x

def parseOptions():
	optParser = optparse.OptionParser()
	optParser.add_option('-d', '--discount',action='store',
                         type='float',dest='discount',default=1.0,
                         help='Discount on future (default %default)')
	optParser.add_option('-r', '--livingReward',action='store',
                         type='float',dest='livingReward',default=0.0,
                         metavar="R", help='Reward for living for a time step (default %default)')
	optParser.add_option('-n', '--noise',action='store',
                         type='float',dest='noise',default=0.0,
                         metavar="P", help='How often action results in ' +
                         'unintended direction (default %default)' )
	optParser.add_option('-e', '--epsilon',action='store',
                         type='float',dest='epsilon',default=0.1,
                         metavar="E", help='Chance of taking a random action in q-learning (default %default)')
	optParser.add_option('-l', '--learningRate',action='store',
                         type='float',dest='learningRate',default=0.5,
                         metavar="P", help='TD learning rate (default %default)' )
	optParser.add_option('-i', '--iterations',action='store',
                         type='int',dest='iters',default=10,
                         metavar="K", help='Number of rounds of value iteration (default %default)')
	optParser.add_option('-k', '--episodes',action='store',
                         type='int',dest='episodes',default=1,
                         metavar="K", help='Number of epsiodes of the MDP to run (default %default)')
	optParser.add_option('-g', '--dialog',action='store',
                         metavar="G", type='string',dest='dialog',default="Dialog",
                         help='Dialog to use (case sensitive; options are Dialog, default %default)' )
	optParser.add_option('-w', '--windowSize', metavar="X", type='int',dest='gridSize',default=150,
                         help='Request a window width of X pixels *per grid cell* (default %default)')
	optParser.add_option('-a', '--agent',action='store', metavar="A",
                         type='string',dest='agent',default="q",
                         help='Agent type (options are \'value\' and \'q\' and \'fq\', default %default)')
	optParser.add_option('-p', '--pause',action='store_true',
                         dest='pause',default=False,
                         help='Pause GUI after each time step when running the MDP')
	optParser.add_option('-q', '--quiet',action='store_true',
                         dest='quiet',default=False,
                         help='Skip display of any learning episodes')
#	optParser.add_option('-s', '--speed',action='store', metavar="S", type=float,
#                         dest='speed',default=1.0,
#                         help='Speed of animation, S > 1.0 is faster, 0.0 < S < 1.0 is slower (default %default)')
	optParser.add_option('-m', '--manual',action='store_true',
                         dest='manual',default=False,
                         help='Manually control agent')
#	optParser.add_option('-v', '--valueSteps',action='store_true' ,default=False,
#                         help='Display each step of value iteration')
	optParser.add_option('-f', '--foldIndex',action='store',
                         type='int',dest='foldIndex',default=0,
                         metavar="F", help='fold Index, 0,1,2,3,4 (default %default)' )
	optParser.add_option('-c', '--numofgauss',action='store',
                         type='int',dest='numofgauss',default=5,
                         metavar="NG", help='Num of Gauss, 0,5,10... (default %default)' )
	optParser.add_option('-v', '--var',action='store',
                         type='float',dest='var',default=0.25,
                         metavar="V", help='Variance, 0.0-1.0 (default %default)' )
	optParser.add_option('-z', '--lamda',action='store',
                         type='float',dest='lamda',default=0.01,
                         metavar="LAM", help='Lamda, 0.0-1.0 (default %default)' )
	optParser.add_option('-t', '--outTheta',action='store',
                         type='string',dest='outTheta',default='theta123',
                         metavar="T", help='Output theta file (default %default)' )
	optParser.add_option('-o', '--outReward',action='store',
                         type='string',dest='outReward',default='out123',
                         metavar="O", help='Output reward file (default %default)' )

	opts, args = optParser.parse_args()
	if opts.manual and opts.agent != 'q':
		print '## Disabling Agents in Manual Mode (-m) ##'
		opts.agent = None

	# MANAGE CONFLICTS
	#if opts.textDisplay or opts.quiet:
	# if opts.quiet:      
	#	opts.pause = False
		# opts.manual = False
      
	#if opts.manual:
	#	opts.pause = True
      
	return opts

def runEpisode(agent, environment, discount, decision, display, message, pause, episode, testFlag=0, foldN=0):
	returns = 0
	turnCount = 0
	totalDiscount = 1.0
	environment.reset(testFlag, foldN)
	
	reward = 0
	AOP = 0
	explore = 0
	rewardFlag = 0 # check if reward first reaches 3.0

	if 'startEpisode' in dir(agent): agent.startEpisode()
	while True:

		# DISPLAY CURRENT STATE
		state = environment.getCurrentState()
#		display(state)
		pause()
    
		# END IF IN A TERMINAL STATE
		actions = environment.getPossibleActions(state)
	
		#print turnCount

		if rewardFlag == 1 or turnCount >= 500:
#			if state.dialogTurnIndex in [11,23,35,47,53,63,73,79,83]:
		#		print returns
				return returns, reward, AOP, explore  # end

		# the old version of exit the dialogue 
		"""
		if len(actions) == 0:
			return returns, reward, AOP, explore # returns: accumulative rewards, reward: 
    	"""
		# GET ACTION (USUALLY FROM AGENT)
		action = decision(state)
		if action == None:
			raise 'Error: Agent returned None action'
    
		# EXECUTE ACTION
		nextState, reward, AOP, explore = environment.doAction(action)

		if reward >= 0:
			rewardFlag = 1

#		print reward, AOP, turnCount

		if testFlag == 0: # training episode
			# UPDATE LEARNER
			if 'observeTransition' in dir(agent): 
			    agent.observeTransition(state, action, nextState, reward) 
		else: # testing episode
			pass

		returns += reward * totalDiscount
		turnCount += explore
		totalDiscount *= discount

