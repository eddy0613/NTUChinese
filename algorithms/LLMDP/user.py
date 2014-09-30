import numpy as np
import random
import math

totalUnit = 101

class User:
	def __init__(self,char):
		self._wholeDialog = []
		self._wholeDialogNoIndex = []
		if char == 'a':
			self._DialogIndex = [0]
		elif char == 'b':
			self._DialogIndex = [1]
		initScore = [101.0 for i in range(0,58)]

		self._phoneScores = []
		self._toneScores = []

		self._phoneAverage = initScore		
		self._toneAverage = initScore[0:43]
		
		self._minIFIndex = []
		self._mintoneIndex = []
		
		self._IFs = []
		self._tones = []
		
		self.totalIF = [0.0 for i in range(0,58)]
		self.totalTone = [0.0 for i in range(0,43)]

		self.goodPhoneCount = [0.0 for i in range(0,58)]
		self.goodToneCount  = [0.0 for i in range(0,43)]
		self.qualifiedUnitPercentage = 0.0

		self.goalReached = 0
	"""
		# Detemine when user enter and leaver the dialogue
		self.startIndex = randomStartIndex()
		self.endIndex  = randomEndIndex()

	# for start index
	def randomStartIndex(self):
		starts = [0,12,24,36,48,54,64,74,80]
		index = random.randint(0,len(starts)-1)
		return starts[index]

	# for end index
	def randomEndIndex(self):
		ends = [11,23,35,47,53,63,73,79,83]
		index = random.randint(0,len(starts)-1)
		return ends[index]
	"""

	def addDialogContent(self,content,contentNoIndex,index):
		self._wholeDialog.append(content)
		self._wholeDialogNoIndex.append(contentNoIndex)
		self._DialogIndex.append(index)

	def addDialogIndex(self,index):
		self._DialogIndex.append(index)

	def addScore(self, phonescore,IF,tonescore,tone):
		self._phoneScores.append(phonescore)
		self._toneScores.append(tonescore)
	
		# check if new input sentence unit score is over 75
		for i in range(0,len(phonescore)):
			if phonescore[i] >= 75.0 and phonescore[i] != 101.0:
				self.goodPhoneCount[i] += 1
		for i in range(0,len(tonescore)):
			if tonescore[i] >= 75.0 and tonescore[i] != 101.0:
				self.goodToneCount[i] += 1

		goodUnitCount = self.goodPhoneCount + self.goodToneCount
		count = 0.0
		for i in goodUnitCount:
			if i >= 5:  # originally 8
				count += 1
		self.qualifiedUnitPercentage  = float(count)/float(totalUnit)

		self.averagePhoneScore()
		self.averageToneScore()
		
		self._IFs.append(IF)
		self._tones.append(tone)
		
		self.addAllIF()
		self.addAlltone()
	
	def averagePhoneScore(self):
		average = []
		for i in range(len(self._phoneScores[0])):
			value = float(0.0)
			denom = 0.0
			for j in range(len(self._phoneScores)):
				if self._phoneScores[j][i] != 101.0:
					denom += 1.0
					value += self._phoneScores[j][i]
			if denom == 0.0 and value == 0.0:
				value = 101.0
			else:
				value /= float(denom)
			if value == 0.0:
				value = 101.0
			average.append(value)
		self._phoneAverage = average

	def addAllIF(self):
		count = {}
		for i in range(0,58):
			for j in range(0,len(self._IFs)):
				if not count.has_key(i):
					count[i] = 0.0
				count[i] += float(self._IFs[j][i])
		self.totalIF = [con for con in count.values()]
		
	def averageToneScore(self):
		average = []
		for i in range(len(self._toneScores[0])):
			value = float(0.0)
			denom = 0.0
			for j in range(len(self._toneScores)):
				if self._toneScores[j][i] != 101.0:
					denom += 1.0
					value += self._toneScores[j][i]
			if denom == 0.0 and value == 0.0:
				value = 101.0
			else:
				value /= float(denom)
			if value == 0.0:
				value = 101.0
			average.append(value)
		self._toneAverage = average

	def addAlltone(self):
		count = {}
		for i in range(0,43):
			for j in range(0,len(self._tones)):
				if not count.has_key(i):
					count[i] = 0.0
				count[i] += float(self._tones[j][i])
		self.totalTone = [con for con in count.values()]

class userGen:
	#def __init__(self, pi, mean, cov):
	def __init__(self, pi, mean, cov, testFlag):
		self.pi = pi
		self.mean = mean
		self.cov = cov
		#self.simulatedSentences = simulatedSentences
		self.testFlag = testFlag
		self.no = 0

		self._prevPhoneCount = [0.0 for i in range(0,58)]
		self._prevToneCount = [0.0 for i in range(0,43)]
		
		self.phoneBuffer = [0.0 for i in range(0,58)]
		self.toneBuffer = [0.0 for i in range(0,43)]

		self.thresholdGaussMean = 6
		self.meanGaussMean = 6
		self.covGaussMean = 6

	def sampleCluster(self):
		sampleOut = random.random()
		if sampleOut < self.pi[self.testFlag][0]:
			self.no = 0
		elif sampleOut < (self.pi[self.testFlag][0]+self.pi[self.testFlag][1]):
			self.no = 1
		else:
			self.no = 2
	
		self.simulatedSentences = np.random.multivariate_normal(self.mean[self.testFlag][self.no],self.cov[self.testFlag][self.no],500)
		self.simulatedSentences = self.simulatedSentences.tolist()

	#@profile
	def userSentenceGen(self,practiceSentenceIFandTone,testFlag,foldN):
		userData = []
		
		randomSentenceIndex = random.randint(0,len(self.simulatedSentences)-1)
		simulateScore = self.simulatedSentences[randomSentenceIndex]

		for i in range(0,len(practiceSentenceIFandTone)):
			if practiceSentenceIFandTone[i] != 0:
				if simulateScore[i] > 100.0:
					score = random.uniform(95, 100)
				elif simulateScore[i] < 0.0:
					score = random.uniform(0,10)
				else:
					score = simulateScore[i]
				userData.append(score)
			else:
				userData.append(101.0)
		return userData
		
		"""
		# original version, slow at np.random.multivariate_normal() function
		userData = []
		simulateScore = np.random.multivariate_normal(self.mean[self.no],self.cov[self.testFlag][self.no],1)
		simulateScore = simulateScore.tolist()

		simulateScore = simulateScore[0]

		for i in range(0,len(practiceSentenceIFandTone)):
			if practiceSentenceIFandTone[i] != 0:
				score = simulateScore[i]
				while (score > 100 or score < 0):
					simulateScore = np.random.multivariate_normal(self.mean[self.no],self.cov[self.testFlag][self.no],1)
					simulateScore = simulateScore.tolist()
					simulateScore = simulateScore[0]
					score = simulateScore[i]
				userData.append(score)
			else:
				userData.append(101.0)
		return userData

		"""
	def userGenScoreUpdate(self,currentPhoneCount,currentToneCount,goodUnitsPercentage):
		"""
		phoneIncrease = []
		toneIncrease = []
		for i in range(0,len(currentPhoneCount)):
			phoneIncrease.append(currentPhoneCount[i] - self._prevPhoneCount[i])
		for i in range(0,len(currentToneCount)):
			toneIncrease.append(currentToneCount[i] - self._prevToneCount[i])
		for i in range(0,len(self.phoneBuffer)):
			self.phoneBuffer[i] += phoneIncrease[i]
		for i in range(0,len(self.toneBuffer)):
			self.toneBuffer[i] += toneIncrease[i]
		"""
		for i in range(0,len(currentPhoneCount)):
			self.phoneBuffer[i] += currentPhoneCount[i] - self._prevPhoneCount[i]
		for i in range(0,len(currentToneCount)):
			self.toneBuffer[i] += currentToneCount[i] - self._prevToneCount[i]

		gaussianGeneratedThreshold = np.random.normal(self.thresholdGaussMean - goodUnitsPercentage * 2, 2 - goodUnitsPercentage) 
		sencentencePracticeThreshold = math.floor(gaussianGeneratedThreshold)
		if sencentencePracticeThreshold <= 0:
			sencentencePracticeThreshold = 1

		#print sencentencePracticeThreshold	
		
		# improve generated phone score
		for i in range(0,len(self.phoneBuffer)):
			additionalCount = int(self.phoneBuffer[i]) / int(sencentencePracticeThreshold)
																	#   3                          2	
			self.mean[self.testFlag][self.no][i] += additionalCount * np.random.normal(self.meanGaussMean + goodUnitsPercentage * 4, 2 - goodUnitsPercentage)
			self.cov[self.testFlag][self.no][i][i] -= additionalCount * np.random.normal(self.covGaussMean + goodUnitsPercentage * 4, 2 - goodUnitsPercentage)
		
			if self.mean[self.testFlag][self.no][i] >= 90.0:
				self.mean[self.testFlag][self.no][i] = 90.0
			if self.cov[self.testFlag][self.no][i][i] <= 0.0:
				self.cov[self.testFlag][self.no][i][i] = 0.0

			# reset buffer to be under threshold
			self.phoneBuffer[i] = int(self.phoneBuffer[i]) % int(sencentencePracticeThreshold)

		# improve generated tone score
		for i in range(0,len(self.toneBuffer)):
			additionalCount = int(self.toneBuffer[i]) / int(sencentencePracticeThreshold)
																	#   3                          2	
			self.mean[self.testFlag][self.no][58+i] += additionalCount * np.random.normal(self.meanGaussMean + goodUnitsPercentage * 4, 2 - goodUnitsPercentage)
			self.cov[self.testFlag][self.no][58+i][58+i] -= additionalCount * np.random.normal(self.covGaussMean + goodUnitsPercentage * 4, 2 - goodUnitsPercentage)
		
			if self.mean[self.testFlag][self.no][58+i] >= 90.0:
				self.mean[self.testFlag][self.no][58+i] = 90.0
			if self.cov[self.testFlag][self.no][58+i][58+i] <= 0.0:
				self.cov[self.testFlag][self.no][58+i][58+i] = 0.0

			# reset buffer to be under threshold
			self.toneBuffer[i] = int(self.toneBuffer[i]) % int(sencentencePracticeThreshold)
		
		# assign currentPhoneCount to self._prevPhoneCount
		self._prevPhoneCount = currentPhoneCount
		self._prevToneCount = currentToneCount
# added by eddy 2012.10.17
def readPiFile(foldN):
	fileName1 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/train/fold_' + str(foldN) + '/learnerPSV_pi'
	fileName2 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/test/fold_' + str(foldN) + '/learnerPSV_pi'
	
	def getPiVector(fileName):
		file = open(fileName,'r')
		pifile = file
		line = pifile.readline()
		tmp = line.strip().split()
		pi = [float(i) for i in tmp ]
		file.close()
		return pi

	pi = []
	pi1 = getPiVector(fileName1)
	pi2 = getPiVector(fileName2)
	pi = [pi1, pi2]
	return pi


def readMuFile(foldN):
	fileName1 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/train/fold_' + str(foldN) + '/learnerPSV_mean'
	fileName2 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/test/fold_' + str(foldN) + '/learnerPSV_mean'

	def getMuVector(fileName):
		mufile = open(fileName,'r')
		mu = []
		for line in mufile:
			tmp = line.strip().split()
			linemu = [float(i) for i in tmp]
			mu.append(linemu)
		return mu
	
	mu = []
	mu1 = getMuVector(fileName1)
	mu2 = getMuVector(fileName2)
	mu = [mu1, mu2]
	return mu

def readCovFile(foldN):
	fileName1 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/train/fold_' + str(foldN) + '/learnerPSV_cov_1'
	fileName2 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/train/fold_' + str(foldN) + '/learnerPSV_cov_2'
	fileName3 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/train/fold_' + str(foldN) + '/learnerPSV_cov_3'
	fileName4 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/test/fold_' + str(foldN) + '/learnerPSV_cov_1'
	fileName5 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/test/fold_' + str(foldN) + '/learnerPSV_cov_2'
	fileName6 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/test/fold_' + str(foldN) + '/learnerPSV_cov_3'

	def getCovVector(filename):
		cov = []
		for line in open(filename,'r'):
			tmp = line.strip().split()
			for i in range(0,len(tmp)):
				tmp[i] = float(tmp[i])
			cov.append(tmp)
		return cov
	
	cov = []
	cov1 = getCovVector(fileName1)
	cov2 = getCovVector(fileName2)
	cov3 = getCovVector(fileName3)

	covTrain = [cov1, cov2, cov3]
	
	cov4 = getCovVector(fileName4)
	cov5 = getCovVector(fileName5)
	cov6 = getCovVector(fileName6)

	covTest = [cov4, cov5, cov6]
	
	cov = [covTrain, covTest]
	
	return cov
"""
def readSentenceFile(foldN):
	fileName1 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/fold_' + str(foldN) + '_train_cluster_1'
	fileName2 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/fold_' + str(foldN) + '_train_cluster_2'
	fileName3 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/fold_' + str(foldN) + '_train_cluster_3'
	fileName4 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/fold_' + str(foldN) + '_test_cluster_1'
	fileName5 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/fold_' + str(foldN) + '_test_cluster_2'
	fileName6 = '/home/eddy0613/dialogue_game/LLMDP/simulatedLearner/5-fold-CV/fold_' + str(foldN) + '_test_cluster_3'

	def getSentVector(filename):
		sentence = []
		file = open(filename,'r')
		for line in file:
			tmp = line.strip().split()
			for i in range(0,len(tmp)):
				tmp[i] = float(tmp[i])
			sentence.append(tmp)
		file.close()
		return sentence
	
	sentenceTrain = []
	sentence1 = getSentVector(fileName1)
	sentence2 = getSentVector(fileName2)
	sentence3 = getSentVector(fileName3)
	
	sentenceTest = []
	sentence4 = getSentVector(fileName4)
	sentence5 = getSentVector(fileName5)
	sentence6 = getSentVector(fileName6)

	sentenceTrain = [sentence1, sentence2, sentence3]
	sentenceTest = [sentence4, sentence5, sentence6]
	
	sentence = [sentenceTrain, sentenceTest]

	return sentence
"""
