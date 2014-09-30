#main.py

from sets import Set
import random
import sys
import mdp
import environment
import util
import optparse
import math
import heapq 

from ContinousLLMDP_tree import *
import networkx as nx
#from dialog_experiment import *
from Action import *
import State
import user
from LLMDPDisplay import *
import valueIterationAgents
import qlearningAgents_tree as qlearningAgents

def main():
	
	opts = parseOptions()

	#print opts
	# GET THE DIALOG CONTENT
	DialogFileName = '/home/eddy0613/dialogue_game/LLMDP/corpus/cycle_tree/0-cycle_tree.changedIndex'
	IFFileName = '/home/eddy0613/dialogue_game/LLMDP/corpus/cycle_tree/6-cycle_tree.lineIF.count'
	toneFileName = '/home/eddy0613/dialogue_game/LLMDP/corpus/cycle_tree/8-cycle_tree.linetoneBoundary.count'
	mdp = getDialog(DialogFileName, IFFileName, toneFileName)

	foldN = int(opts.foldIndex)
	testFlag = 0
	env = Environment(mdp,testFlag,foldN)
	
	globalTestingNum = 100
	existedIterNum = 0 #2000



	# GET THE DISPLAY ADAPTER
	display = LLMDPDisplay(mdp)
	display.start()
	
	# GET THE AGENT
	a = None
	if opts.agent == 'value':
		a = valueIterationAgents.ValueIterationAgent(mdp, opts.discount, opts.iters)
	elif opts.agent == 'q':
		#LLMDPEnv = Environment(mdp)
		actionFn = lambda state: mdp.getPossibleActions(state)
		qLearnOpts = {'gamma': opts.discount, 
					  'alpha': opts.learningRate, 
					  'epsilon': opts.epsilon,
					  'actionFn': actionFn}
		numOfTurn = util.returnConvertedIndexListCount('b','cycle_tree')
		numOfLevelStatus = 3
		unitNum = 101
		a = qlearningAgents.QLearningAgent(numOfTurn,numOfLevelStatus,unitNum,**qLearnOpts)
	elif opts.agent == 'fq':
		#LLMDPEnv = Environment(mdp)
		actionFn = lambda state: mdp.getPossibleActions(state)
		qLearnOpts = {'gamma': opts.discount, 
					  'alpha': opts.learningRate, 
					  'epsilon': opts.epsilon,
					  'actionFn': actionFn}
		numOfTurn = util.returnConvertedIndexListCount('b','cycle_tree')
		numofgauss = opts.numofgauss
		var = opts.var
		lamda = opts.lamda
		unitNum = 101
		a = qlearningAgents.FittedQLearningAgent(numOfTurn,numofgauss,var,lamda,unitNum, **qLearnOpts)
	else:
		if not opts.manual: raise 'Unknown agent type: '+opts.agent
		
	###########################
	# RUN EPISODES
	###########################
	# FIGURE OUT WHAT TO DISPLAY EACH TIME STEP (IF ANYTHING)
	displayCallback = lambda x: None
	if not opts.quiet:
		if opts.manual and opts.agent == None: 
			displayCallback = lambda state: display.displayNullValues(state)
		else:
			if opts.agent == 'value': displayCallback = lambda state: \
					display.displayValues(a, state, "CURRENT VALUES")
			if opts.agent == 'q': displayCallback = lambda state: \
					display.displayQValues(a, state, "CURRENT Q-VALUES")
			if opts.agent == 'fq': displayCallback = lambda state: \
					display.displayQValues(a, state, "CURRENT Q-VALUES")

	messageCallback = lambda x: printString(x)
	if opts.quiet:
		messageCallback = lambda x: None

	decisionCallback = a.getAction
	pauseCallback = lambda : None

	# RUN EPISODES
	foldN = int(opts.foldIndex)

	testIterations = [1,2,5,10,20,50,100,200,500,1000,2000,5000,10000,15000,20000,\
		25000,30000,35000,40000,45000,50000,55000,60000,65000,70000,75000,80000,85000,\
		90000,95000,100000,105000,110000,115000,120000,125000,130000,135000,140000,145000,150000,\
		155000,160000,165000,170000,175000,180000,185000,190000,195000,200000,210000,220000,230000,\
		240000,250000,260000,270000,280000,290000,300000,350000,400000,450000,500000]
	#a.openThetaFile(existedThetaFileName,existedIterNum)

	for episode in range(existedIterNum, opts.episodes+1):
		#if episode %10 == 0:
		#	print episode
#		print 'episode', episode
		# in training episode
		testFlag = 0
		# set epsilon, alpha to user defined values
		a.setEpsilon(0.5 - float(episode)/float(opts.episodes)*(0.5-opts.epsilon))
		
		#a.setEpsilon(opts.epsilon)
		#if episode <= 1000:
		#	a.setEpsilon(0.5)
		#else:
		#	a.setEpsilon(opts.epsilon)
			
		a.setLearningRate(opts.learningRate)

		# update policy by Fitted Value Iteration
		if episode%50 == 0:
			a.fit()

		mdp.setCase(0)
		env = Environment(mdp,testFlag,foldN)

		# updating policy while training, return values not used 
		tmpa,tmpb,tmpc,tmpd = runEpisode(a, env, opts.discount, decisionCallback,\
			         displayCallback, messageCallback, pauseCallback, episode, testFlag, foldN)

		# output policy table
		if episode in testIterations:
			outputTheta = open(opts.outTheta,'a')
			a.printThetaInFile(outputTheta,episode)
			outputTheta.close()

		if episode in testIterations:	
			# in testing episode
			testFlag = 1 
			# set epsilon, alpha to 0
			a.setEpsilon(0.0)
			a.setLearningRate(0.0)
			
			mdp.setCase(0)
			env = Environment(mdp,testFlag,foldN)

			avgReturn, avgLastReward, avgLastAOP, avgLastExplore = 0,0,0,0

			# average of testingNum results
			testingNum = globalTestingNum
			for i in range(0,testingNum):
				# no updating policy, return values are stored for average
				oneReturn, lastReward, lastAOP, lastExplore = runEpisode(a, env, opts.discount, decisionCallback,\
								displayCallback, messageCallback, pauseCallback, episode, testFlag, foldN)
				avgReturn += oneReturn
				avgLastReward += lastReward
				avgLastAOP += lastAOP
				avgLastExplore += lastExplore

			avgReturn /= float(testingNum)
			avgLastReward /= float(testingNum)
			avgLastAOP /= float(testingNum)
			avgLastExplore /= float(testingNum)
			#print episode, avgReturn, avgLastReward, avgLastAOP, avgLastExplore
			print 'Iteration: %d testingReturn: %.4f' %(episode,avgReturn)
			rewardFile = open(opts.outReward,'a') 
			rewardFile.write('Iteration: %d testingReturn: %.4f\n' \
				%(episode,avgReturn))
			rewardFile.close()

		# in practical phase
		if episode in testIterations:	
			# in testing episode
			testFlag = 1 
			# set epsilon, alpha to 0
			a.setEpsilon(0.0)
			a.setLearningRate(0.0)
			
			mdp.setCase(1)
			env = Environment(mdp)
			
			pracAvgReturn = 0

			# average of testingNum results
			testingNum = globalTestingNum
			for i in range(0,testingNum):
				# no updating policy, return values are stored for average
				oneReturn, lastReward, lastAOP, lastExplore = runEpisode(a, env, opts.discount, decisionCallback,\
								displayCallback, messageCallback, pauseCallback, episode, testFlag, foldN)
				pracAvgReturn += oneReturn

			pracAvgReturn /= float(testingNum)
			#print episode, avgReturn, avgLastReward, avgLastAOP, avgLastExplore
			print 'Iteration: %d practicalReturn: %.4f' %(episode,pracAvgReturn)

			rewardFile = open(opts.outReward,'a') 
			rewardFile.write('Iteration: %d practicalReturn: %.4f\n' \
				%(episode,pracAvgReturn))
			rewardFile.write('--------------------------------------------------\n')
			rewardFile.close()
		


if __name__ == '__main__':
	main()
