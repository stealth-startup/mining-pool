#!/usr/bin/env python
import sys
import os
import argparse

parser = argparse.ArgumentParser(description='Generate Config Scripts',epilog='python gen_config.py -t 100 101 102 103 -r 100 191 -u 192.168.0.5 -p 8334')

parser.add_argument("-t", "--tank", help="tank",type=int,required=True,action="store")
parser.add_argument("-u", "--url", help="mining url",required=True,action="store")
parser.add_argument("-p", "--port", help="port",required=True,action="store")

if len(sys.argv)==1:
    parser.print_help()
    sys.exit(1)

args = parser.parse_args()

tank = args.tank
start = 100
end = 191
url = "192.168.0."+args.url
port = args.port

fname= "tank-%s.py" % tank
print "Generating "+fname
with open(fname,"w") as output:
    os.chmod(fname, 0744)
    content="#!/bin/sh\n./config_boards.py -r %d -s %d -e %d -u %s -p %s -w tank%d\n" % (tank,start,end,url,port,tank)
    print content
    output.write(content)
    output.close()
    




