import sys
import os

infile = open(sys.argv[1],'r')
outfile = open(sys.argv[2],'w')

mapping = {}
mappingIndex = []

for line in infile:
	tmp = line.strip().split()
	mappingIndex.append(tmp[0])

	for i in range(3,len(tmp)):
		if not mapping.has_key(tmp[i]):
			mapping[tmp[i]] = [tmp[0]]
		else:
			mapping[tmp[i]].append(tmp[0])

#for key,value in mapping.items():
for key in mappingIndex:
	outfile.write(key+'\t')
	for i in mapping[key]:
		outfile.write(i+' ')
	outfile.write('\n')

#print mapping
