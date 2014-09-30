import os
import sys

outfile = open('all','w')

for line in os.listdir('.'):
	fileName = line.strip()
	outfile.write(fileName+'\n')
	file = open(fileName,'r')
	for l in file:
		outfile.write(l)
	outfile.write('\n\n')


outfile.close()
