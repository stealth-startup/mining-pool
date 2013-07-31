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

forever stopall
forever start -c /usr/bin/node ~/mining-pool/server.js -p 8334
forever start -c /usr/bin/node ~/mining-pool/server.js -p 8335
forever start -c /usr/bin/node ~/mining-pool/server.js -p 8336

i="0"

while [ 1 ] ; do

 i=$[$i+1]
 
 CheckProcess "bitcoind"
 CheckQQ_RET=$?
 if [ $CheckQQ_RET -eq 1 ];
 then
     bitcoind --daemon
 fi

if (("$i" > "15")); then
		i="0"
		forever restartall
fi

/home/david/blocknotify.sh
sleep 300
done

