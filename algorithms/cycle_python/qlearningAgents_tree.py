# qlearningAgents.py

from game import *
from learningAgents import ReinforcementAgent
from featureExtractors import *
import numpy as np
import retmath
import random,util,math
import operator

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
	def __init__(self, numOfTurn, numOfLevelStatus, unitNum, **args):
		"You can initialize Q-values here..."
		ReinforcementAgent.__init__(self, **args)
		self.numOfTurn = numOfTurn
 		self.numOfLevelStatus = numOfLevelStatus
		self.unitNum = unitNum # indicate which unit is the worst
		self.numofQ = 0
		self.qVal = util.Counter()
	
		# init qVal Dictionary
		for t in range(0,self.numOfTurn):
			for level in range(0,self.numOfLevelStatus):
				for worst in range(0,self.unitNum):
					for a in util.turnIndex2action('b','cycle_tree',t):
						state = (t,level,worst)
						key = (state,a)
						self.qVal[key] = 0.0
						self.numofQ += 1

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
#		print tmpReward

	def openQTableFile(self,fname,iteration):
		fin = file(fname)
		lines = fin.readlines()
		"""
		# many zero version
		for i in range(0,len(lines),self.numofQ+1):
			iter = lines[i].split()[1].split(':')[-1]
			if not iter==str(iteration):
				continue
			for j in range(0,self.numofQ):
				index = i+1+self.numofQ
				tokens = lines[index].strip().split('\t')
				state = ( int(i) for i in tokens[0].split()[0].split(',') )
				action = int(tokens[0].split()[1])
				key = (state,action)
				Qvalue = float(tokens[1])
				self.qVal[key] = Qvalue
		"""
		# sparse file version
		for i in range(0,len(lines),2): # 2 means check iterNum every 2 lines
			iter = lines[i].split()[1].split(':')[-1]
			if not iter==str(iteration):
				continue
			index = i+1
			tokens = lines[index].strip().split('\t')
			for t in tokens:
				state = ( int(i) for i in t.split(';')[0].split(',') )
				action = int(t.split(';')[1].split(':')[0])
				key = (state,action)
				Qvalue = float(t.split(';')[1].split(':')[1])
				self.qVal[key] = Qvalue

		fin.close()

	def printQTableInFile(self, fout, iteration):
		print 'Printing policy...'
		sortQVal = sorted(self.qVal.iteritems(),\
			key=operator.itemgetter(0))
		fout.write('------ iteration:'+str(iteration)+' ------\n')
		for key,Q in sortQVal:
#			print key,Q
#			print key[0],key[1]
			state  = key[0]
			action = key[1]
			(turnNum, level, worstUnitIndex) = (state[0], state[1], state[2])
			"""
			# many zero version
			fout.write(str(turnNum)+','+str(level)+','+str(worstUnitIndex)+' '+\
						str(action)+'\t'+str(Q)+'\n')
			"""
			# sparse file version
			if Q != 0.0:
				fout.write(str(turnNum)+','+str(level)+','+str(worstUnitIndex)+';'+\
						str(action)+':'+str(Q)+'\t')
		fout.write('\n')


class FittedQLearningAgent(ReinforcementAgent):

	#def __init__(self, numOfTurn, numofgauss=5, var=0.25, lamda=0, gaussDim=101, **args):
#	@profile
	def __init__(self, numOfTurn, numofgauss, var, lamda, gaussDim, **args):
		"You can initialize Q-values here..."
		ReinforcementAgent.__init__(self, **args)
		self.qVal = util.Counter()
		self.numofgauss = numofgauss
		self.var = var
		self.lamda = lamda
		self.numOfTurn = numOfTurn
		self.gaussDim = gaussDim
		"""
		if self.numofgauss<=5:
			self.minimumNum = 10
		else:
			self.minimumNum = 20
		"""
		
		# init basis 
		self.basis = []
		for i in range(self.numofgauss):
			base = {}
			base['mean'] = np.matrix( [ float(i)/float(self.numofgauss) for j in range(0,self.gaussDim)] )
			base['var'] = np.matrix( np.diag([self.var for j in range(0,self.gaussDim)]) )
			base['detOfVar'] = np.linalg.det(base['var']) # pre-calculate deteminant of covariance
			base['invOfVar'] = np.linalg.inv(base['var']) # pre-calculate inverse of covariance
			#base['mean'] = [ float(i)/float(self.numofgauss) for j in range(0,self.gaussDim)]
			#base['var'] = [self.var for j in range(0,self.gaussDim)]
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
#	@profile	
	def getQValue(self, state, action):
		key = (state.dialogTurnIndex,action)
		theta = self.thetas[key]
		phi = np.matrix([[retmath.multiGaussian(base['mean'],base['var'],base['detOfVar'],\
			base['invOfVar'],state.userState)] for base in self.basis])	
		"""
		phiList = []
		for base in self.basis:
			onePhi = 1.0
			for i in range(0,len(state.userState)):
				onePhi *= retmath.gaussian(base['mean'][i],base['var'][i],state.userState[i])
			phiList.append([onePhi])
		phi = np.matrix(phiList)
		"""
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
 
#	@profile
	def update(self, state, action, nextState, reward):
		key = (state.dialogTurnIndex,action)
		phiJ = [retmath.multiGaussian(base['mean'],base['var'],base['detOfVar'],\
			base['invOfVar'],state.userState) for base in self.basis] 
		"""
		phiList = []
		for base in self.basis:
			onePhi = 1.0
			for i in range(0,len(state.userState)):
				onePhi *= retmath.gaussian(base['mean'][i],base['var'][i],state.userState[i])
			phiList.append([onePhi])
		phiJ = np.matrix(phiList)
		"""
		maxQ = self.getValue(nextState)
		bestaction = self.getPolicy(nextState)
		self.labels[key].append([reward+maxQ])
		for i in range(len(phiJ)):
			self.phis[key][i].append(phiJ[i])
	
#	@profile
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
			if iter == str(iteration):
				print 'i got it'
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


