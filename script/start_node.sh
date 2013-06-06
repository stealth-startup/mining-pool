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

COUNTER=0

 
while [ 1 ] ; do
  COUNTER=$[COUNTER+1]
  if [ $COUNTER -gt 100 ];
  then
    ps -ef | grep '\-p 83' | grep -v grep | awk '{print $2}' | xargs kill -9
    COUNTER=0
  fi

 CheckProcess "8334"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
  node mining-pool/libs/server.js -p 8334 >/dev/null 2>/dev/null &
 fi

 CheckProcess "8335"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
  node mining-pool/libs/server.js -p 8335 >/dev/null 2>/dev/null &
 fi

 CheckProcess "8336"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
  node mining-pool/libs/server.js -p 8336 >/dev/null 2>/dev/null &
 fi

 CheckProcess "8337"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
  node mining-pool/libs/server.js -p 8337 >/dev/null 2>/dev/null &
 fi

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


sleep 300



done

