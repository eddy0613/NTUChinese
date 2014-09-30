# qlearningAgents_tree.py

import operator
import os
from game import *
from learningAgents import ReinforcementAgent
from featureExtractors import *
import numpy as np
import retmath
import random,util,math

class QLearningAgent(ReinforcementAgent):
	"""
	Q-Learning Agent
	
	Functions you should fill in:
	- getQValue
	- getAction
	- getValue
	- getPolicy
	- update

	Instance variables you have access to
	- self.epsilon (exploration prob)
	- self.alpha (learning rate)
	- self.gamma (discount rate)
	
	Functions you should use
	- self.getLegalActions(state) 
	which returns legal actions
	for a state
	"""
	def __init__(self, **args):
		"You can initialize Q-values here..."
		ReinforcementAgent.__init__(self, **args)
		self.qVal = util.Counter()
  
	def getQValue(self, state, action):
		return self.qVal[(state, action)] 

	def getValue(self, state):
		value = 0.0
		actions = self.getLegalActions(state)
		if actions:
			Qvalues = []
			for action in actions:
				Qvalues.append(self.getQValue(state, action))
			value = max(Qvalues)
		return value
	
	def getPolicy(self, state):
		actions = self.getLegalActions(state)
		policy = None
		if actions:
			actionValues = util.Counter()
			for action in actions:
				actionValues[action] = self.getQValue(state, action)
				policy = actionValues.argMax()
		return policy
 
	def getAction(self, state):
		# Pick Action
		legalActions = self.getLegalActions(state)
		action = None
		if legalActions:
			if util.flipCoin(self.epsilon): # if prob < epsilon 
				action = random.choice(legalActions)
			else:
				action = self.getPolicy(state) # elif prob > epsilon
		return action
  
	def update(self, state, action, nextState, reward):
		legalNextActions = self.getLegalActions(nextState)
		tmpReward = reward
		if legalNextActions:
			Qvalues = []
			for nextAction in legalNextActions:
				Qvalues.append(self.getQValue(nextState, nextAction))
			nextMaxQvalue = max(Qvalues)
			tmpReward = reward + self.gamma * nextMaxQvalue
		self.qVal[(state, action)] = (1-self.alpha) * self.qVal[(state, action)]\
							+ self.alpha * tmpReward

class FittedQLearningAgent(ReinforcementAgent):

	def __init__(self, numOfTurn, numofgauss=5, var=0.25, lamda=0, **args):
		"You can initialize Q-values here..."
		ReinforcementAgent.__init__(self, **args)
		self.qVal = util.Counter()
		self.numofgauss = numofgauss
		self.var = var
		self.lamda = lamda
		self.numOfTurn = numOfTurn

		if self.numofgauss<=5:
			self.minimumNum = 10
		else:
			self.minimumNum = 20

		# init basis 
		self.basis = []
		for i in range(self.numofgauss):
			base = {}
			base['mean'] = [ float(i)/float(self.numofgauss) for j in range(0,82)]
			base['var'] = np.diag([var for j in range(0,82)])
			self.basis.append(base)

		# init parameters
		self.thetas = {}
		self.phis = {}
		self.labels = {}
		self.state_action_num = 0
		for t in range(0,self.numOfTurn):
			for a in util.turnIndex2action('b','cycle_tree',t):
				self.thetas[(t,a)] = np.matrix([[0.0] \
				for i in range(self.numofgauss)])	
				self.phis[(t,a)] = [[] for i in range(self.numofgauss)]
				self.labels[(t,a)] = []
				self.state_action_num += 1 # count self.state_action_num

	def openThetaFile(self,fname,iteration):
		fin = file(fname)
		lines = fin.readlines()
		for i in range(0,len(lines),(self.state_action_num-1) * self.numofgauss+1):
			iter = lines[i].split()[1].split(':')[-1]
			if not iter==str(iteration):
				continue
			for j in range(0,self.state_action_num-1):
				index = i+1+j*self.numofgauss
				theta = []
				tokens = lines[index].split('\t')
				key = (int(tokens[0].split(',')[0].replace('(','')),\
				int(tokens[0].split(',')[1].replace(')',''))) 

				theta.append([float(tokens[1].replace('[','').replace(']',''))])
				for idx in range(index+1,index+self.numofgauss):
					theta.append([float(lines[idx].replace('[','').replace(']',''))])
				self.thetas[key] = np.matrix(theta)
		fin.close()

	def getQValue(self, state, action):
		key = (state.dialogTurnIndex,action)
		theta = self.thetas[key]
		phi = np.matrix([[retmath.multiGaussian(base['mean'],base['var'],\
			state.userState)] for base in self.basis])	
		Q = (theta.T*phi).tolist()[0][0]
		return Q
  
	def getValue(self, state):
		value = 0.0
		actions = util.turnIndex2action('b','cycle_tree',state.dialogTurnIndex)
		if actions:
			Qvalues = []
			for action in actions:
				Qvalues.append(self.getQValue(state, action))
			value = max(Qvalues)
		return value
		
	def getPolicy(self, state):
		actions = util.turnIndex2action('b','cycle_tree',state.dialogTurnIndex)
		policy = None
		if actions:
			actionValues = util.Counter()
			for action in actions:
				actionValues[action] = self.getQValue(state, action)
			policy = actionValues.argMax()
		return policy
 
	def getAction(self, state):
		# Pick Action
		legalActions = util.turnIndex2action('b','cycle_tree',state.dialogTurnIndex)
		action = None
		if legalActions:
			if util.flipCoin(self.epsilon): # if prob < epsilon 
				action = random.choice(legalActions)
			else:
				action = self.getPolicy(state) # elif prob > epsilon
		return action
  
	def update(self, state, action, nextState, reward):
		key = (state.dialogTurnIndex,action)
		phiJ = [retmath.multiGaussian(base['mean'],base['var'],state.userState)\
			for base in self.basis] 
		maxQ = self.getValue(nextState)
		bestaction =  self.getPolicy(nextState)
		self.labels[key].append([reward+maxQ])
		for i in range(len(phiJ)):
			self.phis[key][i].append(phiJ[i])

	def fit(self):
		for t in range(0,self.numOfTurn):
			for a in util.turnIndex2action('b','cycle_tree',t):
				key = (t,a)
				if len(self.labels[key])<2:
					continue
				phiMat = np.matrix(self.phis[key])
				Y = np.matrix(self.labels[key])
				del self.thetas[key]
				diag = np.diag([self.lamda for i in range(phiMat.shape[0])])
				self.thetas[key] = (phiMat*(phiMat.T)+diag).I*phiMat*Y
				
	def printThetaInFile(self, fout, iteration):
		print 'Printing policy...'
		sortThetas = sorted(self.thetas.iteritems(),\
			key=operator.itemgetter(0))
		fout.write('------ iteration:'+str(iteration)+' ------\n')
		for statetup,theta in sortThetas:
			fout.write(str(statetup)+'\t'+str(theta)+'\n')

		
				# print parameters thetas
#				print key,
#				for i in (self.thetas[key]).tolist():
#					print i[0],
#				print
				#print self.thetas[key]
	"""
	def maxQ(self,state):
		maxQ = -99999999
		possibleActions = util.turnIndex2action('n','cycle_tree',state(0))
		bestAction = possibleActions[0]
		for a in possibleActions:
			Q = getQValue(state,a):
			if Q>maxQ:
				maxQ = Q
				bestAction = a
		if maxQ<=0:
			bestAction = possibleActions[0]
		return maxQ,bestAction
	"""
