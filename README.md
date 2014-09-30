====== NTUChinese ======

NTU Chinese Demo System for Language Learning.


Acknowledgment:
Pei-Hao Su      phs26@cam.ac.uk             System algorithm and client-sever system prototype implementation
Po-Wei Chou     r01942135@ntu.edu.tw        README.md writing, system combination and acrhitecture refinement
Chuan-Hsun Wu   r02922002@ntu.edu.tw        client display improvement

====== How To Use ======
1)  Put the whole directory under /var/www/ (apache-directory) or using a symbolic link (ln -s source dest)

2)  Install dependencies
    a) bin: sox	(Sound eXchange, see http://sox.sourceforge.net/)
    b) python: networkx, numpy (sudo easy_install networkx, sudo easy_install numpy)
    c) node.js: express (npm install express)

3)  Run the server by
    $ node node.js/server.js
    (Of course you can put it in screen to run in the background)

4)  Open index.html

====== Files & Directories ======
FOLDER			  DESCRIPTIONS
useless/		  some intermediate files under development, not sure it's ok to delete them or not 
user_wav/		  TEMP directory. Wav recored during DEMO lies in here. It's ok to remove them when
			  the server is not on, and therefore ignored by .gitignore.
user_score/		  TEMP directory. Scores analyzed by myct_graders. Kind of the same as above.

==== DEMO client ====
index.html
js/
css/			  Cascade Style Sheet (CSS)
img/
common/			  Common JavaScript libraries used by either *.html or *.js

==== DEMO server ====
go.py			  Python scripts.
node.js/
|_  server.js		  Main server program connecting the client with the core programs
node_modules/		  Node modules. Eg. express
			  (You can also install the latest one using cmd "npm install express", but there's
			   no guarantee of stability due to discrepencies among different versions.)

==== Core Programs ====
myct_grader/		  provided by MyET. (No source codes available)
|_  myct_grader		  A binary executable used for grading the user's Chinese based on
			  1) Pronunciation
			  2) Tone
			  3) Timing
			  4) Emphasis
			  (compiling environment: Linux 64bit executable
			   Linux speech-ubuntu 3.0.0-12-generic #20-Ubuntu SMP Fri Oct 7 14:56:25 UTC 2011 x86_64 x86_64 x86_64 GNU/Linux)
ASAS-cdb.hmm		  HMM needed by binary myct_grader
LCP_Dictory.txt		  Another core file needed by binary myct_grader

algorithms/		  Core algorithms.
dialogueTreeFile/	  DialogueTree and core data.
dialogueTree_owv/
dialogueTree_wav/

==== Others ====
less/
.gitignore
