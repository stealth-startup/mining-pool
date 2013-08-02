# Sample script to start solo mining
# nohup ./start_node.sh &
#!/bin/bash
CheckProcess()
{
  if [ "$1" = "" ];
  then
    return 1
  fi

  PROCESS_NUM=`ps -ef | grep "$1" | grep -v "grep" | wc -l` 
  if [ $PROCESS_NUM -eq 1 ];
  then
    return 0
  else
    return 1
  fi
}

# start all server
forever stopall
forever start ~/mining-pool/server.js -p 8334
forever start ~/mining-pool/server.js -p 8335
forever start ~/mining-pool/server.js -p 8336

i="0"

while [ 1 ] ; do

 i=$[$i+1]
 
 # Check if bitcoind is running
 CheckProcess "bitcoind"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
     bitcoind --daemon
 fi

 
 # Restartall server after certain loop
 if (("$i" > "15")); then
     i="0"
     forever restartall
 fi

 # Call blocknotify.sh
 ./blocknotify.sh
 sleep 300
done

