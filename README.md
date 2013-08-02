Solo Setup
===========
Tested under Ubuntu Server 12.04 and Ubuntu Desktop 13.04

Assume the code is in directory ~/mining

1. **Install bitcoind**

        sudo add-apt-repository ppa:bitcoin/bitcoin
        sudo apt-get update
        sudo apt-get install bitcoind curl 

2. **Install node.js**

        sudo add-apt-repository ppa:chris-lea/node.js
        sudo apt-get update
        sudo apt-get install nodejs

3. **Install node.js package**

        cd ~/mining
        sudo npm install
        sudo npm install -g forever

4. **bitcoind configuration**
  
    We have a default "bitcoin.conf" in ~/mining. 
        
        server=1
        rpcport=8080
        rpcuser=asicminer
        rpcpassword=solo_mining_hurts
        rpcallowip=192.168.*.*
        blocknotify="PATH_TO_YOUR blocknotify.sh"

    "blocknotify.sh" is in directory ~/mining/script. If you login with user name "ubuntu", then modify last line as
        blocknotify="/home/ubuntu/script/blocknotify.sh"
        
    Copy "bitcoin.conf" to bitcoin data directory(default  "~/.bitcoin") 

5. **Solo mining configuration**

   The configuration file is ~/mining/config.json
   
        {
          "bitcoind_ip"   : "127.0.0.1" ,
          "bitcoind_port" : 8080 ,
          "bitcoind_user" : "asicminer",
          "bitcoind_pwd"  : "solo_mining_hurts",
          "coinbase_msg"  : "Mined By ASICMiner",
          "solo_addr" : "1HtUGfbDcMzTeHWx2Dbgnhc6kYnj1Hp24i"
        }

  Note "bitcoind_port", "bitcoind_user", "bitcoind_pwd" should be the same with "rpcport", "rpcuser", "rpcpassword" in your 
bitcoin.conf. "coinbase_msg" is what you want to put in coinbase. And **do remember to modify "solo_addr" to your own address** 
:-)

    
6. **Start solo mining**

   We have a sample script in mining/script "start_node.sh".    

   Suppose we need 3 process running on port 8334, 8335, 8336.
   
   Modify "blocknotify.sh" according to your ports

        #!/bin/sh
        curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8334
        curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8335
        curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8336
 
   Start bitcoind
  
        bitcoind --daemon
        
   Check if bitcoind is running
   
        bitcoind getblocktemplate
        
   Start mining
   
        forever start mining/server.js -p 8334
        forever start mining/server.js -p 8335
        forever start mining/server.js -p 8336

   Stop
        
        forever stopall
        
   Restart 
    
        forever restartall
        
7. **Solo status**

   Open mining/frontend/status.html, type server url and go. Only works with Chrome right now and start chrome with parameter "--disable-web-security".

   For Ubuntu

        chromium-web-browser --disable-web-security

   For Mac

        open -a Google\ Chrome --args --disable-web-security

8. **[Optional]C module for calculating midstate**
   

        sudo npm install -g node-gyp
        cd mining/libs/midstate
        node-gyp configure build


