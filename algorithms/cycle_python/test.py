import sys
import os 
import util


## added by eddy0613 2012/11/21
def turnIndex2action(char,treeName,turnIndexNum):
	infileName = '/blade_b1/home/eddy0613/dialogue_game/LLMDP/corpus/' \
			+ treeName + '/12.1-' + treeName + '.' + char + '.turnIndex2action'
	turnIndexNextDict = {}
	file = open(infileName)
	for line in file:
		split = line.strip().split()
		print split
		if len(split) == 1:
			turnIndexNextDict[int(split[0])] = ''
		else:
			turnIndexNextDict[int(split[0])] = [int(i) for i in split[1:]]
	print turnIndexNextDict
	return turnIndexNextDict[turnIndexNum]

x = turnIndex2action('b','one_tree',32)


if x:
	print 'haha'
else:
	print 'nono'

print util.returnConvertedIndexListCount('b','one_tree')
