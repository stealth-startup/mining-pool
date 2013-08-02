#!/bin/sh
curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8334
curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8335
curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8336
#curl --data-binary '{"jsonrpc":"2","id":"1","method":"update","params":[]}' http://127.0.0.1:8337
