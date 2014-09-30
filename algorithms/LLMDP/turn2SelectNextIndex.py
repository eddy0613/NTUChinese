from sets import Set
import random,sys,math,heapq,optparse
import mdp
import environment
import util
from ContinousLLMDP_tree import *
import State,user
import qlearningAgents_tree as qlearningAgents

def main():
	# GET THE DIALOG CONTENT
	"""
	DialogFileName = '/home/eddy0613/dialogue_game/LLMDP/corpus/cycle_tree/0-cycle_tree.changedIndex'
	IFFileName = '/home/eddy0613/dialogue_game/LLMDP/corpus/cycle_tree/6-cycle_tree.lineIF.count'
	toneFileName = '/home/eddy0613/dialogue_game/LLMDP/corpus/cycle_tree/8-cycle_tree.linetoneBoundary.count'
	"""
	policyFlag = int(sys.argv[3])
	if policyFlag == 0:
		existedIterNum = 15000
		existedThetaFileName = 'algorithms/theta/cycle_tree/of0w1.0g5v0.0625l0.05'
	elif policyFlag == 1:
		existedIterNum = 10000
		existedThetaFileName = 'algorithms/theta/cycle_tree/of0w1.0g5v0.0625l0.05Retroflex'

	qLearnOpts = {'gamma': 1.0, 
				  'alpha': 0.0, 
				  'epsilon': 0.0}
	numOfTurn = util.returnConvertedIndexListCount('b','cycle_tree')
	numofgauss = 5
	var = 0.0625
	lamda = 0.05
	unitNum = 101
	a = qlearningAgents.FittedQLearningAgent(numOfTurn,numofgauss,var,lamda,unitNum, **qLearnOpts)		
	a.openThetaFile(existedThetaFileName,existedIterNum)

	turnNum = int(sys.argv[1])
	userUnitScore = []
	userUnitScoreVector = sys.argv[2].split(',')
	for i in userUnitScoreVector:
			userUnitScore.append(float(i)/100.0)

	state = State.State(turnNum, userUnitScore)
	print a.getAction(state)
	
if __name__ == '__main__':
	main()
