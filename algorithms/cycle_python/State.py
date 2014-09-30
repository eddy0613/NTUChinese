# state.py
#!/usr/bin/python

class State:
	def __init__(self, dialogStateTurn = 0, userState = [1.010 for i in range(0,101)]):
	#def __init__(self, dialogStateTurn, userState):
		self.dialogTurnIndex = dialogStateTurn
		self.userState = userState

