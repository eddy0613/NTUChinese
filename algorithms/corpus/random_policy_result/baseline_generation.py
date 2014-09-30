#-*- coding:big5 -*-

"""
	usage: 
		python baseline_generation.py ../one_tree/one_tree ../one_tree/6-one_tree.lineIF.count  ../one_tree/7-one_tree.linetone.count ../one_tree/8-one_tree.linetoneBoundary.count b startIndex endIndex outs/ 50000
	
	remember to cat the printed 'cat' commands
"""

import subprocess
import os
import sys
import networkx as nx
from user import *
import socket
import json
import random

def ReadFile(infile):
	DialogList = []
	while True:
		line = infile.readline().strip()
		if len(line) == 0:
			break
		temp = line.split()
		temp[0] = int(temp[0])
		for i in range(len(temp[3:])):
			temp[i+3] = int(temp[i+3])
		DialogList.append(temp)
	return DialogList

def InstallGraph(DialogList):
	G = nx.DiGraph()
	Gdict = {}
	for DialogLine in DialogList:
		G.add_node(DialogLine[0],turn = DialogLine[1], content = DialogLine[2],nodeIF = [],nodeTone = [],nodeToneBoundary = [])
		Gdict[DialogLine[0]] = []
		for i in range(len(DialogLine[3:])):
			G.add_edge(DialogLine[0],DialogLine[i+3])
			Gdict[DialogLine[0]].append(DialogLine[i+3])
	return G, Gdict

def lineIF(Graph, linefile):
	cnt = 0
	for line in linefile:
		temp = line.strip().split()
		for i in temp:
			Graph.node[cnt]['nodeIF'].append(int(i))
		cnt += 1	
	return Graph

def lineTone(Graph, linefile):
	cnt = 0
	for line in linefile:
		temp = line.strip().split()
		for i in temp:
			Graph.node[cnt]['nodeTone'].append(int(i))
		cnt += 1	
	return Graph

def lineToneBoundary(Graph, linefile):
	cnt = 0
	for line in linefile:
		temp = line.strip().split()
		for i in temp:
			Graph.node[cnt]['nodeToneBoundary'].append(int(i))
		cnt += 1	
	return Graph


def IsTheEnd(A,B):
	"""
	This fuction checks if the next node is the same as current node.
	If True, it means that it is the end of the dialog.
	"""
	if A == B:
		return True
	else:
		return False

def HammingDiff(IF1,IF2):
	count = 0
	for i in range(0,len(IF1)):
		if (IF1[i] * IF2[i])==0 and (IF1[i]!=0 or IF2[i]!=0):
			count += 1
	return count

if __name__ == "__main__":

	DialogFile = open(sys.argv[1],'r')
	DialogList = ReadFile(DialogFile)

	G = nx.DiGraph()
	G,Gdict = InstallGraph(DialogList)

	IFfile = open(sys.argv[2],'r')
	G = lineIF(G, IFfile)	

	Tonefile = open(sys.argv[3],'r')
	G = lineTone(G,Tonefile)	

	ToneBoundaryfile = open(sys.argv[4],'r')
	G = lineToneBoundary(G,ToneBoundaryfile)	
	#G = lineTone(G,ToneBoundaryfile)	


	#print Gdict

	charID = sys.argv[5]
	startIndex = int(sys.argv[6])
	endIndex = int(sys.argv[7])
	outDir = sys.argv[8]
	runIter = int(sys.argv[9])


	IFoutPathsFileName = outDir + 'IF_paths_' + charID
	ToneoutPathsFileName = outDir + 'Tone_paths_' + charID

	IFoutPathsFile = open(IFoutPathsFileName,'w')
	ToneoutPathsFile = open(ToneoutPathsFileName,'w')

	choose = 0
	if charID == 'a':
		choose = 0
	elif charID == 'b':
		choose = 1

	IF_count = []
	Tone_count = []
	for iter in range(0,runIter+1):
		if iter % 100 == 0:
			print 'iter',iter
		nodeIFList = []
		nodeToneList = []
		k = startIndex
		ct = 0
		while (k<endIndex):
			if ct % 2 == choose:
				#print k, G.node[k]['content']
				nodeIFList.append(G.node[k]['nodeIF'])
				nodeToneList.append(G.node[k]['nodeToneBoundary'])
			k = Gdict[k][random.randint(0, len(Gdict[k])-1)]
			ct += 1

		## for tone count ##
		tonecount = {}
		for i in range(0,43):
			for j in range(0,len(nodeToneList)):
				if not tonecount.has_key(i):
					tonecount[i] = 0.0
				tonecount[i] += float(nodeToneList[j][i])

		Tonecountlist = [con for con in tonecount.values()]
		for i in Tonecountlist:
			ToneoutPathsFile.write(str(i)+' ')
		ToneoutPathsFile.write('\n')
		Tone_count.append(Tonecountlist)

		## for IF count ##
		ifcount = {}
		for i in range(0,58):
			for j in range(0,len(nodeIFList)):
				if not ifcount.has_key(i):
					ifcount[i] = 0.0
				ifcount[i] += float(nodeIFList[j][i])
				
		IFcountlist = [con for con in ifcount.values()]
		for i in IFcountlist:
			IFoutPathsFile.write(str(i)+' ')
		IFoutPathsFile.write('\n')
		IF_count.append(IFcountlist)

	IF_total = {}
	IF_max = {}
	IF_min = {}
	for i in range(0,58):
		for j in range(0,len(IF_count)):
			if not IF_total.has_key(i):
				IF_total[i] = 0.0
			if not IF_max.has_key(i):
				IF_max[i] = 0.0
			if not IF_min.has_key(i):
				IF_min[i] = 1000.0
			if IF_max[i] < float(IF_count[j][i]):
				IF_max[i] = float(IF_count[j][i])
			if IF_min[i] > float(IF_count[j][i]):
				IF_min[i] = float(IF_count[j][i])
			IF_total[i] += float(IF_count[j][i])

	IF_all_max = [imax for imax in IF_max.values()]
	IF_all_min = [imin for imin in IF_min.values()]
	IF_average = [iftotal/(iter+1) for iftotal in IF_total.values()]
	print IF_average
	print IF_all_max
	print IF_all_min

	Tone_total = {}
	Tone_max = {}
	Tone_min = {}
	for i in range(0,43):
		for j in range(0,len(Tone_count)):
			if not Tone_total.has_key(i):
				Tone_total[i] = 0.0
			if not Tone_max.has_key(i):
				Tone_max[i] = 0.0
			if not Tone_min.has_key(i):
				Tone_min[i] = 1000.0
			if Tone_max[i] < float(Tone_count[j][i]):
				Tone_max[i] = float(Tone_count[j][i])
			if Tone_min[i] > float(Tone_count[j][i]):
				Tone_min[i] = float(Tone_count[j][i])
			Tone_total[i] += float(Tone_count[j][i])

	Tone_all_max = [imax for imax in Tone_max.values()]
	Tone_all_min = [imin for imin in Tone_min.values()]
	Tone_average = [iftotal/(iter+1) for iftotal in Tone_total.values()]
	print Tone_average
	print Tone_all_max
	print Tone_all_min


	IFrandomFileName = outDir + 'IF_random_' + charID
	IFmaxFileName = outDir + 'IF_max_' + charID
	IFminFileName = outDir + 'IF_min_' + charID
	TonerandomFileName = outDir + 'Tone_random_' + charID
	TonemaxFileName = outDir + 'Tone_max_' + charID
	ToneminFileName = outDir + 'Tone_min_' + charID

	outfile0 = open(IFrandomFileName,'w')
	for i in IF_average:
		outfile0.write(str(i)+' ')

	outfile1 = open(IFmaxFileName,'w')
	for i in IF_all_max:
		outfile1.write(str(i)+' ')

	outfile2 = open(IFminFileName,'w')
	for i in IF_all_min:
		outfile2.write(str(i)+' ')

	outfile3 = open(TonerandomFileName,'w')
	for i in Tone_average:
		outfile3.write(str(i)+' ')

	outfile4 = open(TonemaxFileName,'w')
	for i in Tone_all_max:
		outfile4.write(str(i)+' ')

	outfile5 = open(ToneminFileName,'w')
	for i in Tone_all_min:
		outfile5.write(str(i)+' ')


	randomFileName = outDir + 'random_' + charID
	maxFileName = outDir + 'max_' + charID
	minFileName = outDir + 'min_' + charID

	catCmdRandom = 'cat ' + IFrandomFileName + ' ' + TonerandomFileName + ' > ' + randomFileName 
	catCmdMax = 'cat ' + IFmaxFileName + ' ' + TonemaxFileName + ' > ' + maxFileName 
	catCmdMin = 'cat ' + IFminFileName + ' ' + ToneminFileName + ' > ' + minFileName 
	#os.system(catCmdRandom)
	#os.system(catCmdMax)
	#os.system(catCmdMin)

	print (catCmdRandom)
	print (catCmdMax)
	print (catCmdMin)


