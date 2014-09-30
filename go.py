import os
import sys

userWavIndex = sys.argv[1]
fileName = sys.argv[2]

fileName = fileName.replace('user_wav/','')
fileName_22050 = fileName.replace('.wav','_22050.wav')
file_score = fileName.replace('.wav','.score')
file_score_utf8 = file_score + '_utf8'

cmd1 = 'sox user_wav/' + fileName + ' -r 22050 -c 1 user_wav/' + fileName_22050
cmd2 = './myct_grader/myct_grader dialogueTree_owv/'+userWavIndex+'.owv user_wav/' + fileName_22050 + ' > user_score/' + file_score
cmd3 = 'iconv -f big5 -t utf-8 user_score/' + file_score + ' -o user_score/' + file_score_utf8
cmd4 = 'cat user_score/' + file_score_utf8

#USER_DIR = './'
#USER_SCORE = USER_DIR + 'user_score/'
#USER_WAV = USER_DIR + 'user_wav/'
#cmd1 = 'sox ' + USER_WAV + fileName + ' -r 22050 -c 1 ' + USER_WAV + fileName_22050
#cmd2 = './myct_grader/myct_grader dialogueTree_owv/' + userWavIndex + '.owv ' + USER_WAV + fileName_22050 + ' > ' + USER_SCORE + file_score
#cmd3 = 'iconv -f big5 -t utf-8 ' + USER_SCORE + file_score + ' -o ' + USER_SCORE + file_score_utf8
#cmd4 = 'cat ' + USER_SCORE + file_score_utf8

os.system(cmd1)
os.system(cmd2)
os.system(cmd3)
os.system(cmd4)
