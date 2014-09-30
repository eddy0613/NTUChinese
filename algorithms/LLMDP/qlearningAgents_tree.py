# qlearningAgents.py

from game import *
from learningAgents import ReinforcementAgent
import numpy as np
import retmath
import random,util,math
import operator

class FittedQLearningAgent(ReinforcementAgent):

	def __init__(self, numOfTurn, numofgauss, var, lamda, gaussDim, **args):
		"You can initialize Q-values here..."
		ReinforcementAgent.__init__(self, **args)
		self.qVal = util.Counter()
		self.numofgauss = numofgauss
		self.var = var
		self.lamda = lamda
		self.numOfTurn = numOfTurn
		self.gaussDim = gaussDim
	
		# init basis 
		self.basis = []
		for i in range(self.numofgauss):
			base = {}
			base['mean'] = np.matrix( [ float(i)/float(self.numofgauss) for j in range(0,self.gaussDim)] )
			base['var'] = np.matrix( np.diag([self.var for j in range(0,self.gaussDim)]) )
			base['detOfVar'] = np.linalg.det(base['var']) # pre-calculate deteminant of covariance
			base['invOfVar'] = np.linalg.inv(base['var']) # pre-calculate inverse of covariance
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
	
	def getQValue(self, state, action):
		key = (state.dialogTurnIndex,action)
		theta = self.thetas[key]
		phi = np.matrix([[retmath.multiGaussian(base['mean'],base['var'],base['detOfVar'],\
			base['invOfVar'],state.userState)] for base in self.basis])	
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
		phiJ = [retmath.multiGaussian(base['mean'],base['var'],base['detOfVar'],\
			base['invOfVar'],state.userState) for base in self.basis] 
		maxQ = self.getValue(nextState)
		bestaction = self.getPolicy(nextState)
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

	def openThetaFile(self,fname,iteration):
		fin = file(fname)
		lines = fin.readlines()
		for i in range(0,len(lines),(self.state_action_num) * self.numofgauss+1):
			iter = lines[i].split()[1].split(':')[-1]
			if not iter==str(iteration):
				continue
			for j in range(0,self.state_action_num):
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

	def printThetaInFile(self, fout, iteration):
		print 'Printing policy...'
		sortThetas = sorted(self.thetas.iteritems(),\
			key=operator.itemgetter(0))
		fout.write('------ iteration:'+str(iteration)+' ------\n')
		for statetup,theta in sortThetas:
			fout.write(str(statetup)+'\t'+str(theta)+'\n')
