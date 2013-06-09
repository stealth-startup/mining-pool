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

forever start -w ~/mining-pool/libs/server.js -p 8334
forever start -w ~/mining-pool/libs/server.js -p 8335
forever start -w ~/mining-pool/libs/server.js -p 8336

 
while [ 1 ] ; do
 CheckProcess "bitcoind"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
     bitcoind --daemon
 fi

 CheckProcess "namecoind"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
     namecoind -daemon
 fi

./blocknotify.sh
./blocknotify_namecoin.sh

sleep 300
done

