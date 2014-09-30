import math
import operator
import numpy as np

def cross_entropy(p1,p2):
	if p2==0:
		return 0
	else:
		return -1*p1*math.log(p1/p2)

def renormalize(distdict):
	Z = sum(distdict.values())
	if Z == 1:
		return distdict
	nol = {}
	for key in distdict.iterkeys():
		nol[key] = distdict[key]/Z
	return nol

def gaussian(mean,var,x):
	return 1/math.sqrt(2*math.pi*var)*\
		math.exp(-1/2*math.pow((x-mean)/math.sqrt(var),2))

#@profile
def multiGaussian(meanMatrix, covMatrix, detOfCov, invOfCov, obsVec):
	"""
	implement multivariate Gaussian pdf function
	"""
	dimK = len(obsVec)

	mean = meanMatrix
	cov = covMatrix
	x = np.matrix(obsVec)

	part1 = (2*np.pi)**(-0.5*dimK)
	part2 = detOfCov**(-0.5)
	dev = x-mean

	expPart1 = np.dot(dev,invOfCov)
	expPart2 = np.dot(expPart1,dev.T)
	part3 = np.exp(-0.5*expPart2)
	dmvnorm =(part1*part2*part3).tolist()[0][0]
	return dmvnorm

def entropy(model):
	ent = 0.0
	for key,p in model.iteritems():
		ent += -1*p*math.log(p)
	return ent

def cross_entropies(model1,model2):
	cent = 0.0
	for key1,p1 in model1.iteritems():
		if model2.has_key(key1):
			p2 = model2[key1]
			cent += cross_entropy(p1,p2)
	return cent

def stdev(data):
	norm2 = 0.0
	mean = sum(data)/float(len(data))
	for d in data:
		norm2 += math.pow(d,2)/float(len(data))
	return math.sqrt(norm2-math.pow(mean,2))

def Exp(lamda,x):
	return lamda*math.exp(-1*lamda*x)

def FitExpDistribution(ret,lamda):
	expdist = [Exp(lamda,x) for x in range(100)]
	mean = sum(expdist)/float(len(expdist))
	expdist = [x/mean for x in expdist]

	rank = map(operator.itemgetter(1),ret)[:100]
	meanX = sum(rank)/float(len(rank)) + rank[-1]
	rank = [(r+rank[-1])/meanX for r in rank]
	
	err = 0.0
	for i in range(len(rank)):
	#print rank[i], expdist[i]
		err += math.pow(rank[i]-expdist[i],2)
	return math.sqrt(err)

def FitGaussDistribution(ret,m,v):
	gaussdist = [gaussian(m,v,x) for x in range(100)]
	mean = sum(gaussdist)/float(len(gaussdist))
	gaussdist = [x/mean for x in gaussdist]

	rank = map(operator.itemgetter(1),ret)[:100]
	meanX = sum(rank)/float(len(rank)) + rank[-1]
	rank = [(r+rank[-1])/meanX for r in rank]
	
	err = 0.0
	for i in range(len(rank)):
	#print rank[i], gaussdist[i]
		err += math.pow(rank[i]-gaussdist[i],2)
	return math.sqrt(err)


