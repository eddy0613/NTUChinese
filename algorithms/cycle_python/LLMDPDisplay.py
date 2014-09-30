#LLMDPDisplay.py

import util

class LLMDPDisplay:
  
	def __init__(self, llmdp):
		self.llmdp = llmdp
  
	def start(self):
		pass
  
	def pause(self):
		pass
  
	def displayValues(self, agent, currentState = None, message = None):
		if message != None:
			print message
		values = util.Counter()
		policy = {}
		states = self.llmdp.getStates()
		for state in states:
			values[state] = agent.getValue(state)
			policy[state] = agent.getPolicy(state)
#			print state, values[state], policy[state]
  
	def displayNullValues(self, agent, currentState = None, message = None):
		if message != None: print message

	def displayQValues(self, agent, currentState = None, message = None):
		if message != None: print message
		qValues = util.Counter()
		states = self.llmdp.getStates()
		for state in states:
			for action in self.llmdp.getPossibleActions(state):
				qValues[(state, action)] = agent.getQValue(state, action)
				print state,action,  qValues[(state, action)]
