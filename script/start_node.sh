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
 
 
while [ 1 ] ; do

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

./blocknotify.sh

sleep 300

done

